const pool = require("../database/db");
const {
  confirmReservedStock,
  releaseReservedStock,
} = require("../stock/stock.service");
const notificationService = require("../notifications/notification.service");
const ORDER_STATUS_PENDING_REVIEW = "Pending Pharmacist Review";

const uploadPrescription = async (orderItemId, fileUrl, userId = null) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderItemResult = await client.query(
      `
      SELECT
        oi.id,
        oi.order_id,
        o.customer_id,
        o.status AS order_status,
        m.requires_prescription
      FROM order_items oi
      JOIN orders o
        ON oi.order_id = o.id
      JOIN medicines m
        ON oi.medicine_id = m.id
      WHERE oi.id = $1;
      `,
      [orderItemId]
    );

    if (orderItemResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const orderItem = orderItemResult.rows[0];

    if (userId && orderItem.customer_id !== userId) {
      throw new Error(
        "You are not authorized to upload a prescription for this order item."
      );
    }

    if (!orderItem.requires_prescription) {
      throw new Error(
        "This medicine does not require a prescription."
      );
    }

    const existingPrescription = await client.query(
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

    const result = await client.query(
      `INSERT INTO prescriptions (order_item_id, file_url)
       VALUES ($1, $2)
       RETURNING *`,
      [orderItemId, fileUrl]
    );

    if (orderItem.order_status !== ORDER_STATUS_PENDING_REVIEW) {
      await client.query(
        `
        UPDATE orders
        SET status = $1
        WHERE id = $2;
        `,
        [ORDER_STATUS_PENDING_REVIEW, orderItem.order_id]
      );
    }

    await client.query("COMMIT");
    return result.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
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

    const prescriptionResult = await client.query(
      `
      SELECT
    p.*,
    oi.medicine_id,
    oi.quantity,
    oi.order_id,
    o.branch_id,
    o.customer_id
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

    // Keep verification logging from main
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

    if (status === "approved") {
      await confirmReservedStock(
        client,
        prescription.branch_id,
        prescription.medicine_id,
        prescription.quantity
      );

      const pendingResult = await client.query(
        `
        SELECT oi.id
        FROM order_items oi
        JOIN medicines m
          ON oi.medicine_id = m.id
        LEFT JOIN prescriptions p
          ON p.order_item_id = oi.id
        WHERE oi.order_id = $1
          AND m.requires_prescription = TRUE
          AND (
            p.id IS NULL
            OR p.status <> 'approved'
          )
        LIMIT 1;
        `,
        [prescription.order_id]
      );

      if (pendingResult.rowCount === 0) {
        await client.query(
          `
          UPDATE orders
          SET status = 'Verified',
              status_updated_at = CURRENT_TIMESTAMP
          WHERE id = $1;
          `,
          [prescription.order_id]
        );
      }
    } else if (status === "rejected") {
      await releaseReservedStock(
        client,
        prescription.branch_id,
        prescription.medicine_id,
        prescription.quantity
      );
      await client.query(
        `
        UPDATE orders
        SET
          status = 'Rejected',
          status_updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
        `,
        [prescription.order_id]
      );
      await notificationService.createNotification({
        user_id: prescription.customer_id,
        type: "PRESCRIPTION_REJECTED",
        payload: {
          orderId: prescription.order_id,
          prescriptionId,
          message:
            "Your prescription was rejected. The reserved stock has been released.",
        },
      });
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
const updateStandingApproval = async (
  prescriptionId,
  pharmacistId,
  isActive
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch prescription, customer and medicine details
    const prescriptionResult = await client.query(
      `
      SELECT
        p.id,
        oi.medicine_id,
        o.customer_id
      FROM prescriptions p
      JOIN order_items oi
        ON p.order_item_id = oi.id
      JOIN orders o
        ON oi.order_id = o.id
      WHERE p.id = $1
        AND p.status = 'approved';
      `,
      [prescriptionId]
    );

    if (prescriptionResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const prescription = prescriptionResult.rows[0];

    if (isActive) {
      await client.query(
        `
        INSERT INTO standing_prescriptions
        (
          customer_id,
          medicine_id,
          prescription_id,
          approved_by,
          is_active
        )
        VALUES ($1, $2, $3, $4, TRUE)
        ON CONFLICT (customer_id, medicine_id)
        DO UPDATE
        SET
          prescription_id = EXCLUDED.prescription_id,
          approved_by = EXCLUDED.approved_by,
          is_active = TRUE,
          revoked_at = NULL;
        `,
        [
          prescription.customer_id,
          prescription.medicine_id,
          prescription.id,
          pharmacistId,
        ]
      );
    } else {
      await client.query(
        `
        UPDATE standing_prescriptions
SET
  is_active = FALSE,
  revoked_at = CURRENT_TIMESTAMP
WHERE
  customer_id = $1
  AND medicine_id = $2
  AND is_active = TRUE
RETURNING *;
        `,
        [
          prescription.customer_id,
          prescription.medicine_id,
        ]
      );
    }

    await client.query("COMMIT");

    return {
  prescriptionId,
  isActive,
};

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
const getVerificationLogsByOrder = async (orderId) => {
  const { rows } = await pool.query(
    `
    SELECT
      vl.id,
      vl.prescription_id,
      vl.pharmacist_id,
      vl.decision,
      vl.created_at
    FROM verification_logs vl
    JOIN prescriptions p
      ON vl.prescription_id = p.id
    JOIN order_items oi
      ON p.order_item_id = oi.id
    WHERE oi.order_id = $1
    ORDER BY vl.created_at DESC;
    `,
    [orderId]
  );

  return rows;
};

const releaseExpiredPrescriptionHolds = async (timeoutMinutes = 60) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const expiredResult = await client.query(
      `
      SELECT
        p.id AS prescription_id,
        p.order_item_id,
        oi.order_id,
        oi.medicine_id,
        oi.quantity,
        o.branch_id,
        o.customer_id
      FROM prescriptions p
      JOIN order_items oi
        ON p.order_item_id = oi.id
      JOIN orders o
        ON oi.order_id = o.id
      WHERE p.status = 'pending'
        AND o.status = 'Pending Pharmacist Review'
        AND p.created_at <= NOW() - ($1 || ' minutes')::INTERVAL;
      `,
      [timeoutMinutes]
    );

    const releasedOrders = [];

    for (const row of expiredResult.rows) {
      await releaseReservedStock(
        client,
        row.branch_id,
        row.medicine_id,
        row.quantity
      );

      await client.query(
        `
        UPDATE prescriptions
        SET status = 'expired',
            reviewed_at = CURRENT_TIMESTAMP
        WHERE id = $1;
        `,
        [row.prescription_id]
      );

      await client.query(
        `
        UPDATE orders
        SET status = 'Cancelled',
            status_updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
        `,
        [row.order_id]
      );

      await notificationService.createNotification({
        user_id: row.customer_id,
        type: "PRESCRIPTION_EXPIRED",
        payload: {
          orderId: row.order_id,
          prescriptionId: row.prescription_id,
          message:
            "Your prescription review timed out. The reserved stock has been released and your order has been cancelled.",
        },
      });

      releasedOrders.push(row.order_id);
    }

    await client.query("COMMIT");
    return releasedOrders;
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
  updateStandingApproval,
  getVerificationLogsByOrder,
  releaseExpiredPrescriptionHolds,
};