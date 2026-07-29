const express = require("express");
const router = express.Router();

const stockController = require("./stock.controller");
const {
  validateThresholdUpdate,
} = require("./stock.validation");

router.patch(
  "/threshold",
  validateThresholdUpdate,
  stockController.updateLowStockThreshold
);

router.post(
  "/alerts/generate",
  stockController.generateLowStockAlerts
);

module.exports = router;