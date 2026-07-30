const express = require("express");
const router = express.Router();

const stockController = require("./stock.controller");
const {
  validateThresholdUpdate,
} = require("./stock.validation");

router.get(
  "/",
  stockController.getBranchStock
);


router.patch(
  "/threshold",
  validateThresholdUpdate,
  stockController.updateLowStockThreshold
);

router.post(
  "/alerts/generate",
  stockController.generateLowStockAlerts
);
router.patch(
  "/alerts/:id/acknowledge",
  stockController.acknowledgeAlert
);

router.post(
  "/alerts/escalate",
  stockController.escalateAlerts
);

router.get(
  "/alerts/escalated",
  stockController.getEscalatedAlerts
);
module.exports = router;