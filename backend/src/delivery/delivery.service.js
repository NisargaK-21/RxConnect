const pool = require("../database/db");

const getAvailableJobs = async (user) => {
  const result = await pool.query(
    `
    SELECT
      o.id AS order_reference,
      o.status,
      o.created_at,
      b.name AS pickup_branch,
      b.address AS pickup_branch_address
    FROM orders o
    JOIN branches b
      ON o.branch_id = b.id
    WHERE o.status = 'Packed'
      AND o.branch_id = $1
      AND o.delivery_partner_id IS NULL
    ORDER BY o.created_at ASC
    `,
    [user.branch_id]
  );

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
      throw new Error("Only packed orders can be claimed");
    }

    if (order.delivery_partner_id !== null) {
      throw new Error("Order has already been claimed");
    }

    const updatedOrder = await client.query(
  `
  UPDATE orders
  SET
    delivery_partner_id = $1
  WHERE id = $2
  RETURNING *;
  `,
  [deliveryPartnerId, orderId]
);

    await client.query("COMMIT");

    return {
      message: "Delivery job assigned successfully",
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
  const result = await pool.query(
    `
    UPDATE orders
    SET
      status = 'Out for Delivery',
      status_updated_at = CURRENT_TIMESTAMP
    WHERE
      id = $1
      AND delivery_partner_id = $2
      AND status = 'Packed'
    RETURNING *;
    `,
    [orderId, deliveryPartnerId]
  );

  if (result.rows.length === 0) {
    throw new Error(
      "Packed order assigned to this delivery partner not found"
    );
  }

  return {
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
    message: "Order delivered successfully",
    order: result.rows[0],
  };
};

const getMyJobs = async (deliveryPartnerId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM orders
    WHERE delivery_partner_id = $1
    ORDER BY created_at ASC
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