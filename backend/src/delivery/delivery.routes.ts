import express, { Router } from "express";

import authenticate from "../middleware/auth.middleware";
import authorize from "../middleware/role.middleware";

import {
  getAvailableJobs,
  claimJob,
  confirmPickup,
  confirmDelivery,
  getMyJobs,
} from "./delivery.controller";

const router: Router = express.Router();

router.use(authenticate);

router.get(
  "/jobs",
  authorize("delivery", "admin"),
  getAvailableJobs
);

router.post(
  "/jobs/:orderId/claim",
  authorize("delivery"),
  claimJob
);

router.patch(
  "/jobs/:orderId/claim",
  authorize("delivery"),
  claimJob
);

router.patch(
  "/jobs/:orderId/pickup",
  authorize("delivery"),
  confirmPickup
);

router.patch(
  "/jobs/:orderId/deliver",
  authorize("delivery"),
  confirmDelivery
);

router.get(
  "/my-jobs",
  authorize("delivery", "admin"),
  getMyJobs
);

export default router;