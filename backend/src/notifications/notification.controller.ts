import { Request, Response } from "express";
import * as notificationService from "./notification.service";

const createNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const notification =
      await notificationService.createNotification(
        req.body
      );

    return res.status(201).json({
      message: "Notification created successfully",
      notification,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const getNotificationsByUser = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.params.userId as string;

    const notifications =
      await notificationService.getNotificationsByUser(
        userId
      );

    return res.status(200).json(notifications);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const markAsRead = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id as string;

    const notification =
      await notificationService.markAsRead(
        id
      );

    return res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export {
  createNotification,
  getNotificationsByUser,
  markAsRead,
};