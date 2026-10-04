import express, { Router } from "express";
import * as stockController from "./stock.controller";
import { validateThresholdUpdate } from "./stock.validation";

const router: Router = express.Router();

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

export default router;