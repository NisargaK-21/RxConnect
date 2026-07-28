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

module.exports = {
  updateLowStockThreshold,
};