const pool = require("../database/db");

const updateLowStockThreshold = async (
  branchId,
  medicineId,
  lowStockThreshold
) => {
  const result = await pool.query(
    `
    UPDATE branch_stock
    SET low_stock_threshold = $1
    WHERE branch_id = $2
      AND medicine_id = $3
    RETURNING *;
    `,
    [lowStockThreshold, branchId, medicineId]
  );

  return result.rows[0];
};

const generateLowStockAlerts = async () => {
  const result = await pool.query(`
    INSERT INTO low_stock_alerts (
      branch_stock_id,
      quantity_at_alert
    )
    SELECT
      bs.id,
      bs.quantity
    FROM branch_stock bs
    WHERE bs.quantity <= bs.low_stock_threshold
      AND NOT EXISTS (
        SELECT 1
        FROM low_stock_alerts lsa
        WHERE lsa.branch_stock_id = bs.id
          AND lsa.acknowledged = false
      )
    RETURNING *;
  `);

  return result.rows;
};

module.exports = {
  updateLowStockThreshold,
  generateLowStockAlerts,
};