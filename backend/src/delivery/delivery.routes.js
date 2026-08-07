const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const deliveryController = require("./delivery.controller");

router.use(authenticate);

router.get(
  "/jobs",
  authorize("delivery", "admin"),
  deliveryController.getAvailableJobs
);

router.post(
  "/jobs/:orderId/claim",
  authorize("delivery", "admin"),
  deliveryController.claimJob
);

router.patch(
  "/jobs/:orderId/claim",
  authorize("delivery", "admin"),
  deliveryController.claimJob
);

router.patch(
  "/jobs/:orderId/pickup",
  authorize("delivery", "admin"),
  deliveryController.confirmPickup
);

router.patch(
  "/jobs/:orderId/deliver",
  authorize("delivery", "admin"),
  deliveryController.confirmDelivery
);

router.get(
  "/my-jobs",
  authorize("delivery", "admin"),
  deliveryController.getMyJobs
);

module.exports = router;