import {
  updateLowStockThreshold as updateLowStockThresholdService,
  generateLowStockAlerts as generateLowStockAlertsService,
  acknowledgeAlert as acknowledgeAlertService,
  escalateUnacknowledgedAlerts as escalateUnacknowledgedAlertsService,
  getEscalatedAlerts as getEscalatedAlertsService,
  getBranchStock as getBranchStockService,
} from "./stock.service";

const updateLowStockThreshold = async (
  req: any,
  res: any
) => {
  try {
    const {
      branchId,
      medicineId,
      lowStockThreshold,
    } = req.body;

    const updatedStock =
      await updateLowStockThresholdService(
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
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const generateLowStockAlerts = async (
  req: any,
  res: any
) => {
  try {
    const alerts =
      await generateLowStockAlertsService();

    return res.status(201).json({
      message: "Low stock alerts generated successfully",
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const acknowledgeAlert = async (
  req: any,
  res: any
) => {
  try {
    const { id } = req.params;

    const alert =
      await acknowledgeAlertService(id);

    if (!alert) {
      return res.status(404).json({
        message: "Alert not found",
      });
    }

    return res.status(200).json({
      message: "Alert acknowledged successfully",
      data: alert,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const escalateAlerts = async (
  req: any,
  res: any
) => {
  try {
    const alerts =
      await escalateUnacknowledgedAlertsService();

    return res.status(200).json({
      message: "Escalation completed",
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getEscalatedAlerts = async (
  req: any,
  res: any
) => {
  try {
    const alerts =
      await getEscalatedAlertsService();

    return res.status(200).json({
      data: alerts,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getBranchStock = async (
  req: any,
  res: any
) => {
  try {
    const { branchId } = req.query;

    const stock =
      await getBranchStockService(branchId);

    return res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export {
  updateLowStockThreshold,
  generateLowStockAlerts,
  acknowledgeAlert,
  escalateAlerts,
  getEscalatedAlerts,
  getBranchStock,
};