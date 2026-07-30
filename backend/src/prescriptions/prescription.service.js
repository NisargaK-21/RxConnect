const pool = require("../database/db");

const uploadPrescription = async (orderItemId, fileUrl) => {
  const check = await pool.query(
    "SELECT id FROM order_items WHERE id = $1",
    [orderItemId]
  );

  if (check.rows.length === 0) {
    return null;
  }

  const result = await pool.query(
    `INSERT INTO prescriptions (order_item_id, file_url)
     VALUES ($1, $2)
     RETURNING *`,
    [orderItemId, fileUrl]
  );

  return result.rows[0];
};
const getPrescriptionById = async (id) => {
  const result = await pool.query(
    `SELECT
        p.*,
        o.customer_id,
        oi.order_id
     FROM prescriptions p
     JOIN order_items oi
       ON p.order_item_id = oi.id
     JOIN orders o
       ON oi.order_id = o.id
     WHERE p.id = $1`,
    [id]
  );

  return result.rows[0];
};
module.exports = {
  uploadPrescription,
  getPrescriptionById,
};