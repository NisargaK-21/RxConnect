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

module.exports = {
  updateLowStockThreshold,
};