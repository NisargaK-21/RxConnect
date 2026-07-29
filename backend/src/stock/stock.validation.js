const validateThresholdUpdate = (req, res, next) => {
  const { branchId, medicineId, lowStockThreshold } = req.body;

  if (!branchId || !medicineId || lowStockThreshold === undefined) {
    return res.status(400).json({
      message: "branchId, medicineId and lowStockThreshold are required",
    });
  }

  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
    return res.status(400).json({
      message: "lowStockThreshold must be a non-negative integer",
    });
  }

  next();
};

module.exports = {
  validateThresholdUpdate,
};