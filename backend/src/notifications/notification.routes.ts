import express from "express";
import notificationController from "./notification.controller";
const router = express.Router();

router.post("/", notificationController.createNotification);

router.get("/:userId", notificationController.getNotificationsByUser);

router.patch("/:id/read", notificationController.markAsRead);

export default router;