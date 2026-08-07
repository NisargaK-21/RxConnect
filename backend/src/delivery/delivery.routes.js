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

module.exports = router;