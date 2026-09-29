import { Request, Response } from "express";
import * as stockService from "./stock.service";


const updateLowStockThreshold = async (req:Request, res:Response) => {
  try {
    const { branchId, medicineId, lowStockThreshold } = req.body;

    const updatedStock = await stockService.updateLowStockThreshold(
      branchId,
      medicineId,
      lowStockThreshold
    );

    if (!updatedStock) {
      return res.status(404).json({
        message: "Branch stock record not found",
      });
    }

    return res.status(200).json({
      message: "Low stock threshold updated successfully",
      data: updatedStock,
    });
  } catch (error:any) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const generateLowStockAlerts = async (req:Request, res:Response) => {
  try {
    const alerts = await stockService.generateLowStockAlerts();

    return res.status(201).json({
      message: "Low stock alerts generated successfully",
      count: alerts.length,
      data: alerts,
    });
  } catch (error:any) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const acknowledgeAlert = async (req:Request, res:Response) => {
  try {
    const { id } = req.params;

    const alert = await stockService.acknowledgeAlert(Number(id));

    if (!alert) {
      return res.status(404).json({
        message: "Alert not found",
      });
    }

    return res.status(200).json({
      message: "Alert acknowledged successfully",
      data: alert,
    });
  } catch (error:any) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const escalateAlerts = async (req:Request, res:Response) => {
  try {
    const alerts =
      await stockService.escalateUnacknowledgedAlerts();

    return res.status(200).json({
      message: "Escalation completed",
      count: alerts.length,
      data: alerts,
    });
  } catch (error:any) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getEscalatedAlerts = async (req:Request, res:Response) => {
  try {
    const alerts =
      await stockService.getEscalatedAlerts();

    return res.status(200).json({
      data: alerts,
    });
  } catch (error:any) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};


const getBranchStock = async (req:Request, res:Response) => {
  try {
    const { branchId } = req.query;

    const stock = await stockService.getBranchStock(Number(branchId));

    return res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (err:any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export default {
  updateLowStockThreshold,
  generateLowStockAlerts,
  acknowledgeAlert,
  escalateAlerts,
  getEscalatedAlerts,
  getBranchStock
};