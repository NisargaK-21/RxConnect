const notificationService = require("./notification.service");

const createNotification = async (req, res) => {
  try {
    const notification = await notificationService.createNotification(req.body);

    return res.status(201).json({
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const getNotificationsByUser = async (req, res) => {
  try {
    const notifications = await notificationService.getNotificationsByUser(
      req.params.userId
    );

    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(
        req.params.id
    );

    return res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createNotification,
  getNotificationsByUser,
  markAsRead,
};