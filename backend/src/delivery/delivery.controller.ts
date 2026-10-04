import type {
  Request,
  Response,
} from "express";

interface AuthenticatedUser {
  id: number;
  [key: string]: unknown;
}

const deliveryService = require("./delivery.service");

const getAuthenticatedUser = (
  req: Request
): AuthenticatedUser => {
  return (req as Request & {
    user: AuthenticatedUser;
  }).user;
};

const getAvailableJobs = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getAuthenticatedUser(req);

    const jobs =
      await deliveryService.getAvailableJobs(
        user
      );

    return res.status(200).json(jobs);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch available jobs";

    return res.status(500).json({
      message,
    });
  }
};

const claimJob = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getAuthenticatedUser(req);
    const { orderId } = req.params;

    const result =
      await deliveryService.claimJob(
        orderId,
        user.id
      );

    return res.status(200).json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to claim job";

    return res.status(400).json({
      message,
    });
  }
};

const confirmPickup = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getAuthenticatedUser(req);
    const { orderId } = req.params;

    const result =
      await deliveryService.confirmPickup(
        orderId,
        user.id
      );

    return res.status(200).json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to confirm pickup";

    return res.status(400).json({
      message,
    });
  }
};

const confirmDelivery = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getAuthenticatedUser(req);
    const { orderId } = req.params;

    const result =
      await deliveryService.confirmDelivery(
        orderId,
        user.id
      );

    return res.status(200).json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to confirm delivery";

    return res.status(400).json({
      message,
    });
  }
};

const getMyJobs = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getAuthenticatedUser(req);

    const jobs =
      await deliveryService.getMyJobs(
        user.id
      );

    return res.status(200).json(jobs);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch your jobs";

    return res.status(500).json({
      message,
    });
  }
};

export {
  getAvailableJobs,
  claimJob,
  confirmPickup,
  confirmDelivery,
  getMyJobs,
};