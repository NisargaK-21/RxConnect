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

module.exports = {
  getTodaysOrdersPerBranch,
};