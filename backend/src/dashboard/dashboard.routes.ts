import express, { Router } from "express";
import {
  getDashboard,
  getLowStockDashboard,
  getFulfillmentDashboard,
  getRecurringFulfillmentFailures,
  recordFulfillmentFailure,
} from "./dashboard.controller";

const router: Router = express.Router();

router.get("/", getDashboard);

router.get(
  "/lowstock",
  getLowStockDashboard
);

router.get(
  "/fulfillment",
  getFulfillmentDashboard
);

router.get(
  "/recurring-failures",
  getRecurringFulfillmentFailures
);

router.get(
  "/fulfillment-failures",
  getRecurringFulfillmentFailures
);

router.get(
  "/failures",
  getRecurringFulfillmentFailures
);

router.post(
  "/fulfillment-failures",
  recordFulfillmentFailure
);

export default router;