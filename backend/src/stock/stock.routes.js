const express = require("express");
const router = express.Router();

const stockController = require("./stock.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const {
  validateThresholdUpdate,
} = require("./stock.validation");

router.get(
  "/",
  authenticate,
  authorize("admin", "pharmacist", "staff", "customer", "delivery"),
  stockController.getBranchStock
);

router.patch(
  "/threshold",
  authenticate,
  authorize("admin", "pharmacist", "staff"),
  validateThresholdUpdate,
  stockController.updateLowStockThreshold
);

router.post(
  "/alerts/generate",
  authenticate,
  authorize("admin", "pharmacist", "staff"),
  stockController.generateLowStockAlerts
);

router.patch(
  "/alerts/:id/acknowledge",
  authenticate,
  authorize("admin", "pharmacist", "staff"),
  stockController.acknowledgeAlert
);

router.post(
  "/alerts/escalate",
  authenticate,
  authorize("admin", "pharmacist", "staff"),
  stockController.escalateAlerts
);

router.get(
  "/alerts/escalated",
  authenticate,
  authorize("admin", "pharmacist", "staff"),
  stockController.getEscalatedAlerts
);

module.exports = router;