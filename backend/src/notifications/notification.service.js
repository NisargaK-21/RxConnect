const pool = require("../database/db");


const createNotification = async ({ user_id, type, payload }) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, payload)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [user_id, type, payload]
  );

  return result.rows[0];
};

const getNotificationsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};

const markAsRead = async (id) => {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = true
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createNotification,
  getNotificationsByUser,
  markAsRead,
};