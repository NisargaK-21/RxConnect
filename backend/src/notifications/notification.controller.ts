import {
  createNotification as createNotificationService,
  getNotificationsByUser as getNotificationsByUserService,
  markAsRead as markAsReadService,
} from "./notification.service";

const createNotification = async (
  req: any,
  res: any
) => {
  try {
    const notification =
      await createNotificationService(req.body);

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
  req: any,
  res: any
) => {
  try {
    const notifications =
      await getNotificationsByUserService(
        req.params.userId
      );

    return res.status(200).json(
      notifications
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const markAsRead = async (
  req: any,
  res: any
) => {
  try {
    const notification =
      await markAsReadService(
        req.params.id
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