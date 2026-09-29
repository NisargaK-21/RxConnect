import express from "express";
import authenticate from "../middleware/auth.middleware";
import authorize from "../middleware/role.middleware";

import deliveryController from "./delivery.controller";
const router = express.Router();

router.use(authenticate);

router.get(
  "/jobs",
  authorize("delivery", "admin"),
  deliveryController.getAvailableJobs
);

router.post(
  "/jobs/:orderId/claim",
  authorize("delivery"),
  deliveryController.claimJob
);

router.patch(
  "/jobs/:orderId/claim",
  authorize("delivery"),
  deliveryController.claimJob
);

router.patch(
  "/jobs/:orderId/pickup",
  authorize("delivery"),
  deliveryController.confirmPickup
);

router.patch(
  "/jobs/:orderId/deliver",
  authorize("delivery"),
  deliveryController.confirmDelivery
);

router.get(
  "/my-jobs",
  authorize("delivery", "admin"),
  deliveryController.getMyJobs
);

export default router;