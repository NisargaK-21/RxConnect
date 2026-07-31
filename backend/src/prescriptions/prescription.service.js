const pool = require("../database/db");
const {
  confirmReservedStock,
  releaseReservedStock,
} = require("../stock/stock.service");
const uploadPrescription = async (orderItemId, fileUrl) => {
  const orderItemResult = await pool.query(
    `
    SELECT
        oi.id,
        m.requires_prescription
    FROM order_items oi
    JOIN medicines m
        ON oi.medicine_id = m.id
    WHERE oi.id = $1;
    `,
    [orderItemId]
);

if (orderItemResult.rowCount === 0) {
    return null;
}

const orderItem = orderItemResult.rows[0];

if (!orderItem.requires_prescription) {
    throw new Error(
        "This medicine does not require a prescription."
    );
}
const existingPrescription = await pool.query(
    `
    SELECT id
    FROM prescriptions
    WHERE order_item_id = $1;
    `,
    [orderItemId]
);

if (existingPrescription.rowCount > 0) {
    throw new Error(
        "Prescription already uploaded for this order item."
    );
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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
    const prescriptionResult = await client.query(
      `
      SELECT
        p.*,
        oi.medicine_id,
        oi.quantity,
        o.branch_id
      FROM prescriptions p
      JOIN order_items oi
        ON p.order_item_id = oi.id
      JOIN orders o
        ON oi.order_id = o.id
      WHERE p.id = $1;
      `,
      [prescriptionId]
    );

    if (prescriptionResult.rowCount === 0) {
      throw new Error("Prescription not found");
    }

    const prescription = prescriptionResult.rows[0];

    const updatedPrescription = await client.query(
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

    if (result.rows.length === 0) {
      throw new Error("Prescription not found");
    }

    await client.query(
      `
      INSERT INTO verification_logs
      (
        prescription_id,
        pharmacist_id,
        decision
      )
      VALUES ($1, $2, $3);
      `,
      [prescriptionId, pharmacistId, status]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
    if (status === "approved") {
      await confirmReservedStock(
        client,
        prescription.branch_id,
        prescription.medicine_id,
        prescription.quantity
      );
    }

    if (status === "rejected") {
      await releaseReservedStock(
        client,
        prescription.branch_id,
        prescription.medicine_id,
        prescription.quantity
      );
    }

    await client.query("COMMIT");

    return updatedPrescription.rows[0];

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;

  } finally {
    client.release();
  }
};
module.exports = {
 uploadPrescription,
  getPrescriptionById,
  getPendingPrescriptions,
  reviewPrescription,
};