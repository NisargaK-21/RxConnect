const pool = require("../database/db");

const getTodaysOrdersPerBranch = async () => {
  const branchResult = await pool.query(`
    SELECT
      id,
      name
    FROM branches
    ORDER BY name;
  `);

  const dashboard = [];

  for (const branch of branchResult.rows) {
    const orderResult = await pool.query(
      `
      SELECT
        id,
        customer_id,
        status,
        created_at
      FROM orders
      WHERE branch_id = $1
        AND DATE(created_at) = CURRENT_DATE
      ORDER BY created_at DESC;
      `,
      [branch.id]
    );

    dashboard.push({
      branchId: branch.id,
      branchName: branch.name,
      orderCount: orderResult.rows.length,
      orders: orderResult.rows,
    });
  }

  return dashboard;
};



const getLowStockPerBranch = async () => {
  const result = await pool.query(`
    SELECT
      b.id AS branch_id,
      b.name AS branch_name,
      m.id AS medicine_id,
      m.name AS medicine_name,
      bs.quantity,
      bs.low_stock_threshold,
      lsa.id AS alert_id,
      lsa.acknowledged,
      lsa.created_at
    FROM low_stock_alerts lsa
    JOIN branch_stock bs
      ON lsa.branch_stock_id = bs.id
    JOIN branches b
      ON bs.branch_id = b.id
    JOIN medicines m
      ON bs.medicine_id = m.id
    ORDER BY b.name, m.name;
  `);

  const grouped = {};

  for (const row of result.rows) {
    if (!grouped[row.branch_id]) {
      grouped[row.branch_id] = {
        branchId: row.branch_id,
        branchName: row.branch_name,
        lowStockItems: [],
      };
    }

    grouped[row.branch_id].lowStockItems.push({
      alertId: row.alert_id,
      medicineId: row.medicine_id,
      medicineName: row.medicine_name,
      quantity: row.quantity,
      threshold: row.low_stock_threshold,
      acknowledged: row.acknowledged,
      createdAt: row.created_at,
    });
  }

  return Object.values(grouped);
};


const getBranchFulfillmentRate = async ({ startDate = null, endDate = null } = {}) => {
  const result = await pool.query(
    `
    SELECT
      b.id,
      b.name,
      COUNT(o.id) AS total_orders,
      COUNT(
        CASE
          WHEN o.status = 'Delivered'
          THEN 1
        END
      ) AS delivered_orders
    FROM branches b
    LEFT JOIN orders o
      ON b.id = o.branch_id
      AND ($1::date IS NULL OR DATE(o.created_at) >= $1::date)
      AND ($2::date IS NULL OR DATE(o.created_at) <= $2::date)
    GROUP BY b.id, b.name
    ORDER BY b.name;
  `,
    [startDate, endDate]
  );

  return result.rows.map((branch) => {
    const total = Number(branch.total_orders);
    const delivered = Number(branch.delivered_orders);

    const fulfillmentRate =
      total === 0
        ? 0
        : Number(((delivered / total) * 100).toFixed(2));

    return {
      branchId: branch.id,
      branchName: branch.name,
      totalOrders: total,
      deliveredOrders: delivered,
      fulfillmentRate,
    };
  });
};

const logFulfillmentFailure = async (
  { branchId, medicineId = null, orderId = null, failureReason = "insufficient_stock" },
  client = pool
) => {
  if (!branchId) {
    throw new Error("branchId is required to log fulfillment failure");
  }

  const result = await client.query(
    `
    INSERT INTO fulfillment_failure_logs (branch_id, medicine_id, order_id, failure_reason)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    `,
    [branchId, medicineId, orderId, failureReason]
  );

  return result.rows[0];
};

const getRecurringFulfillmentFailures = async ({
  threshold = 3,
  startDate = null,
  endDate = null,
} = {}) => {
  const thresholdNum =
    typeof threshold === "number" && !Number.isNaN(threshold)
      ? threshold
      : Number(threshold) || 3;

  const params = [];
  let paramIndex = 1;
  let dateFilter = "";

  if (startDate) {
    dateFilter += ` AND DATE(ffl.created_at) >= ${paramIndex++}::date`;
    params.push(startDate);
  }

  if (endDate) {
    dateFilter += ` AND DATE(ffl.created_at) <= ${paramIndex++}::date`;
    params.push(endDate);
  }

  const query = `
    SELECT
      b.id AS branch_id,
      b.name AS branch_name,
      b.address AS branch_address,
      COUNT(ffl.id)::int AS failure_count
    FROM branches b
    LEFT JOIN fulfillment_failure_logs ffl
      ON b.id = ffl.branch_id
      AND ffl.failure_reason = 'insufficient_stock'
      ${dateFilter}
    GROUP BY b.id, b.name, b.address
    ORDER BY failure_count DESC, b.name ASC;
  `;

  const result = await pool.query(query, params);

  return result.rows.map((row) => {
    const failureCount = Number(row.failure_count || 0);
    const isFlagged = failureCount >= thresholdNum;

    return {
      branchId: row.branch_id,
      branchName: row.branch_name,
      address: row.branch_address,
      failureCount,
      threshold: thresholdNum,
      isFlagged,
      flagged: isFlagged,
    };
  });
};

module.exports = {
  getTodaysOrdersPerBranch,
  getLowStockPerBranch,
  getBranchFulfillmentRate,
  logFulfillmentFailure,
  getRecurringFulfillmentFailures,
  getFulfillmentFailures: getRecurringFulfillmentFailures,
};