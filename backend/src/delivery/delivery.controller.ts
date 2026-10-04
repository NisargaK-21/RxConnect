import { Request, Response } from "express";
import * as deliveryService from "./delivery.service";

const getAvailableJobs = async (
  req: Request,
  res: Response
) => {
  try {
    const jobs = await deliveryService.getAvailableJobs(
      req.user || null
    );

    res.status(200).json(jobs);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const claimJob = async (
  req: Request,
  res: Response
) => {
  try {
    const orderId = req.params.orderId as string;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await deliveryService.claimJob(
      orderId,
      req.user.id
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const confirmPickup = async (
  req: Request,
  res: Response
) => {
  try {
    const orderId = req.params.orderId as string;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await deliveryService.confirmPickup(
      orderId,
      req.user.id
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const confirmDelivery = async (
  req: Request,
  res: Response
) => {
  try {
    const orderId = req.params.orderId as string;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await deliveryService.confirmDelivery(
      orderId,
      req.user.id
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const getMyJobs = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const jobs = await deliveryService.getMyJobs(
      req.user.id
    );

    res.status(200).json(jobs);
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
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
