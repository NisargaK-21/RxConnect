const stockService = require("./stock.service");


const updateLowStockThreshold = async (req, res) => {
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
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const generateLowStockAlerts = async (req, res) => {
  try {
    const alerts = await stockService.generateLowStockAlerts();

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
const acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await stockService.acknowledgeAlert(id);

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

const escalateAlerts = async (req, res) => {
  try {
    const alerts =
      await stockService.escalateUnacknowledgedAlerts();

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

const getEscalatedAlerts = async (req, res) => {
  try {
    const alerts =
      await stockService.getEscalatedAlerts();

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


const getBranchStock = async (req, res) => {
  try {
    const { branchId } = req.query;

    const stock = await stockService.getBranchStock(branchId);

    return res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


module.exports = {
  updateLowStockThreshold,
  generateLowStockAlerts,
  acknowledgeAlert,
  escalateAlerts,
  getEscalatedAlerts,
  getBranchStock
};