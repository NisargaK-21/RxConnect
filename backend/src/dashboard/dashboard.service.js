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

module.exports = {
  getTodaysOrdersPerBranch,
  getLowStockPerBranch,
};