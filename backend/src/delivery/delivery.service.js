const pool = require("../database/db");

const getAvailableJobs = async (user) => {
  let query = `
    SELECT
      o.id,
      o.id AS order_reference,
      o.status,
      o.created_at,
      b.name AS pickup_branch,
      b.address AS pickup_branch_address,
      u.address AS delivery_address,
      u.name AS customer_name
    FROM orders o
    JOIN branches b ON o.branch_id = b.id
    JOIN users u ON o.customer_id = u.id
    WHERE o.status = 'Packed'
      AND o.delivery_partner_id IS NULL
  `;
  const params = [];

  if (user && user.branch_id) {
    query += ` AND o.branch_id = $1`;
    params.push(user.branch_id);
  }

  query += ` ORDER BY o.created_at ASC`;

  const result = await pool.query(query, params);
  return result.rows;
};

const claimJob = async (orderId, deliveryPartnerId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1
      FOR UPDATE
      `,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error("Order not found");
    }

    const order = orderResult.rows[0];

    if (order.status !== "Packed") {
      throw new Error(`Order status is '${order.status}'. Only packed orders can be claimed.`);
    }

    if (order.delivery_partner_id !== null) {
      if (Number(order.delivery_partner_id) === Number(deliveryPartnerId)) {
        throw new Error("You have already claimed this order.");
      }
      throw new Error("This delivery job has already been claimed by another partner.");
    }

    const updatedOrder = await client.query(
      `
      UPDATE orders
      SET
        delivery_partner_id = $1,
        status_updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
      `,
      [deliveryPartnerId, orderId]
    );

    await client.query("COMMIT");

    return {
      success: true,
      message: "Delivery job claimed successfully",
      order: updatedOrder.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const confirmPickup = async (orderId, deliveryPartnerId) => {
  const orderCheck = await pool.query(
    `SELECT * FROM orders WHERE id = $1`,
    [orderId]
  );

  if (orderCheck.rows.length === 0) {
    throw new Error("Order not found");
  }

  const order = orderCheck.rows[0];

  if (order.delivery_partner_id !== null && Number(order.delivery_partner_id) !== Number(deliveryPartnerId)) {
    throw new Error("This order is assigned to another delivery partner.");
  }

  if (order.status !== "Packed") {
    throw new Error(
      `Invalid transition: Cannot confirm pickup for an order with status '${order.status}'. Only Packed orders can be picked up.`
    );
  }

  const result = await pool.query(
    `
    UPDATE orders
    SET
      status = 'Out for Delivery',
      status_updated_at = CURRENT_TIMESTAMP,
      pickup_timestamp = CURRENT_TIMESTAMP
    WHERE
      id = $1
      AND delivery_partner_id = $2
      AND status = 'Packed'
    RETURNING *;
    `,
    [orderId, deliveryPartnerId]
  );

  if (result.rows.length === 0) {
    throw new Error("Failed to confirm pickup. Please verify job assignment.");
  }

  return {
    success: true,
    message: "Order picked up successfully",
    order: result.rows[0],
  };
};

const confirmDelivery = async (orderId, deliveryPartnerId) => {
  const result = await pool.query(
    `
    UPDATE orders
    SET
      status = 'Delivered',
      status_updated_at = CURRENT_TIMESTAMP
    WHERE
      id = $1
      AND delivery_partner_id = $2
      AND status = 'Out for Delivery'
    RETURNING *;
    `,
    [orderId, deliveryPartnerId]
  );

  if (result.rows.length === 0) {
    throw new Error(
      "Out for Delivery order assigned to this delivery partner not found"
    );
  }

  return {
    success: true,
    message: "Order delivered successfully",
    order: result.rows[0],
  };
};

const getMyJobs = async (deliveryPartnerId) => {
  const result = await pool.query(
    `
    SELECT
      o.id,
      o.id AS order_reference,
      o.status,
      o.created_at,
      o.status_updated_at,
      o.pickup_timestamp,
      b.name AS pickup_branch,
      b.name AS branch_name,
      b.address AS pickup_branch_address,
      u.address AS delivery_address,
      u.name AS customer_name
    FROM orders o
    JOIN branches b ON o.branch_id = b.id
    JOIN users u ON o.customer_id = u.id
    WHERE o.delivery_partner_id = $1
      AND o.status IN ('Packed', 'Out for Delivery', 'Delivered')
    ORDER BY o.created_at DESC
    `,
    [deliveryPartnerId]
  );

  return result.rows;
};

module.exports = {
  getAvailableJobs,
  claimJob,
  confirmPickup,
  confirmDelivery,
  getMyJobs,
};