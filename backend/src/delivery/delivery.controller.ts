import { Request, Response } from "express";
import deliveryService from "./delivery.service";
const getAvailableJobs = async (req:Request, res:Response) => {
  try {
    const jobs = await deliveryService.getAvailableJobs(req.user);

    res.status(200).json(jobs);
  } catch (error:any) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const claimJob = async (req:Request, res:Response) => {
  try {
    const { orderId } = req.params;

    const result = await deliveryService.claimJob(
      Number(orderId),
      req.user.id
    );

    res.status(200).json(result);
  } catch (error:any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const confirmPickup = async (req:Request, res:Response) => {
  try {
    const { orderId } = req.params;

    const result = await deliveryService.confirmPickup(
      Number(orderId),
      req.user.id
    );

    res.status(200).json(result);
  } catch (error:any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const confirmDelivery = async (req:Request, res:Response) => {
  try {
    const { orderId } = req.params;

    const result = await deliveryService.confirmDelivery(
      Number(orderId),
      req.user.id
    );

    res.status(200).json(result);
  } catch (error:any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const getMyJobs = async (req:Request, res:Response) => {
  try {
    const jobs = await deliveryService.getMyJobs(req.user.id);

    res.status(200).json(jobs);
  } catch (error:any) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export default {
  getAvailableJobs,
  claimJob,
  confirmPickup,
  confirmDelivery,
  getMyJobs,
};