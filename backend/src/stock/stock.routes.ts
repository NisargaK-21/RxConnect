import express from "express";

import {
  updateLowStockThreshold,
  generateLowStockAlerts,
  acknowledgeAlert,
  escalateAlerts,
  getEscalatedAlerts,
  getBranchStock,
} from "./stock.controller";

import authenticate from "../middleware/auth.middleware";
import authorize from "../middleware/role.middleware";

import { validateThresholdUpdate } from "./stock.validation";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("admin", "pharmacist", "staff", "customer", "delivery"),
  getBranchStock
);

router.patch(
  "/threshold",
  authenticate,
  authorize("admin", "pharmacist", "staff"),
  validateThresholdUpdate,
  updateLowStockThreshold
);

router.post(
  "/alerts/generate",
  authenticate,
  authorize("admin", "pharmacist", "staff"),
  generateLowStockAlerts
);

router.patch(
  "/alerts/:id/acknowledge",
  authenticate,
  authorize("admin", "pharmacist", "staff"),
  acknowledgeAlert
);

router.post(
  "/alerts/escalate",
  authenticate,
  authorize("admin", "pharmacist", "staff"),
  escalateAlerts
);

router.get(
  "/alerts/escalated",
  authenticate,
  authorize("admin", "pharmacist", "staff"),
  getEscalatedAlerts
);

export default router;