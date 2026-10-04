import express, { Router } from "express";

import {
  createNotification,
  getNotificationsByUser,
  markAsRead,
} from "./notification.controller";

const router: Router = express.Router();

router.post(
  "/",
  createNotification
);

router.get(
  "/:userId",
  getNotificationsByUser
);

router.patch(
  "/:id/read",
  markAsRead
);

export default router;