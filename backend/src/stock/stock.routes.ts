import express from "express";

import stockController from "./stock.controller";
import authenticate from "../middleware/auth.middleware";
import authorize from "../middleware/role.middleware";
import {validateThresholdUpdate} from "./stock.validation";
const router = express.Router();

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

export default router;