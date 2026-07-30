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
const getPendingPrescriptions = async (
  branchId,
  page,
  limit,
  sort
) => {
  const offset = (page - 1) * limit;

  const query = `
    SELECT
        p.id AS prescription_id,
        p.file_url,
        p.status,

        o.id AS order_id,

        u.id AS customer_id,
        u.name AS customer_name,

        oi.quantity,

        m.id AS medicine_id,
        m.name AS medicine_name

    FROM prescriptions p

    JOIN order_items oi
      ON p.order_item_id = oi.id

    JOIN orders o
      ON oi.order_id = o.id

    JOIN users u
      ON o.customer_id = u.id

    JOIN medicines m
      ON oi.medicine_id = m.id

    WHERE
      p.status = 'pending'
      AND o.branch_id = $1

    ORDER BY p.id ${sort}
    LIMIT $2
    OFFSET $3;
  `;

  const result = await pool.query(query, [
    branchId,
    limit,
    offset
  ]);

  return result.rows;
};
const reviewPrescription = async (
  prescriptionId,
  pharmacistId,
  status
) => {
  const result = await pool.query(
    `
    UPDATE prescriptions
    SET
      status = $1,
      reviewed_by = $2,
      reviewed_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *;
    `,
    [status, pharmacistId, prescriptionId]
  );

  return result.rows[0];
};
module.exports = {
 uploadPrescription,
  getPrescriptionById,
  getPendingPrescriptions,
  reviewPrescription,
};