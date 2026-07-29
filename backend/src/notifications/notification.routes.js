const express = require("express");
const router = express.Router();

const {
  createNotification,
  getNotificationsByUser,
  markAsRead,
} = require("./notification.controller");

router.post("/", createNotification);

router.get("/:userId", getNotificationsByUser);

router.patch("/:id/read", markAsRead);

module.exports = router;