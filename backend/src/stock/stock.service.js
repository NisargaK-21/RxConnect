const pool = require("../database/db");
const notificationService = require("../notifications/notification.service");


const decrementStock = async (client, branchId, medicineId, quantity) => {
  const result = await client.query(
    `
    UPDATE branch_stock
    SET quantity = quantity - $1
    WHERE branch_id = $2
      AND medicine_id = $3
      AND quantity >= $1
    RETURNING *;
    `,
    [quantity, branchId, medicineId]
  );

  if (result.rowCount === 0) {
    throw new Error("Insufficient stock");
  }

  return result.rows[0];
};

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

  for (const alert of result.rows) {
    const stockResult = await pool.query(
      `
      SELECT
        bs.branch_id,
        bs.quantity,
        m.name AS medicine_name,
        b.name AS branch_name
      FROM branch_stock bs
      JOIN medicines m ON bs.medicine_id = m.id
      JOIN branches b ON bs.branch_id = b.id
      WHERE bs.id = $1;
      `,
      [alert.branch_stock_id]
    );

    if (stockResult.rows.length === 0) continue;

    const stock = stockResult.rows[0];
    const pharmacists = await pool.query(
      `
      SELECT id
      FROM users
      WHERE role = 'pharmacist'
        AND branch_id = $1;
      `,
      [stock.branch_id]
    );
    for (const pharmacist of pharmacists.rows) {
      await notificationService.createNotification({
  user_id: pharmacist.id,
  type: "LOW_STOCK_ALERT",
  payload: {
    medicine: stock.medicine_name,
    branch: stock.branch_name,
    remainingQuantity: stock.quantity,
  },
});

      console.log(
        `[STUB] SMS/Email -> Pharmacist ${pharmacist.id}: ${stock.medicine_name} at ${stock.branch_name} has only ${stock.quantity} units remaining`
      );
    }
  }

  return result.rows;
};
const acknowledgeAlert = async (alertId) => {
  const result = await pool.query(
    `
    UPDATE low_stock_alerts
    SET acknowledged = TRUE
    WHERE id = $1
    RETURNING *;
    `,
    [alertId]
  );

  return result.rows[0];
};

const escalateUnacknowledgedAlerts = async () => {
  const result = await pool.query(
    `
    UPDATE low_stock_alerts
    SET escalated = TRUE
    WHERE acknowledged = FALSE
      AND escalated = FALSE
      AND created_at <= NOW() - INTERVAL '30 minutes'
    RETURNING *;
    `
  );

  return result.rows;
};
const getEscalatedAlerts = async () => {
  const result = await pool.query(
    `
    SELECT
      lsa.*,
      b.name AS branch_name,
      m.name AS medicine_name
    FROM low_stock_alerts lsa
    JOIN branch_stock bs
      ON lsa.branch_stock_id = bs.id
    JOIN branches b
      ON bs.branch_id = b.id
    JOIN medicines m
      ON bs.medicine_id = m.id
    WHERE lsa.escalated = TRUE
    ORDER BY lsa.created_at DESC;
    `
  );

  return result.rows;
};
module.exports = {
  decrementStock,
  updateLowStockThreshold,
  generateLowStockAlerts,
  acknowledgeAlert,
  escalateUnacknowledgedAlerts,
  getEscalatedAlerts,
};