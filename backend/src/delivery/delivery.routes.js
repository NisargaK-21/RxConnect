const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth.middleware");

const deliveryController = require("./delivery.controller");

router.get(
  "/jobs",
  authenticate,
  deliveryController.getAvailableJobs
);

router.patch(
  "/jobs/:orderId/claim",
  authenticate,
  deliveryController.claimJob
);

router.patch(
  "/jobs/:orderId/pickup",
  authenticate,
  deliveryController.confirmPickup
);

router.get(
  "/my-jobs",
  authenticate,
  deliveryController.getMyJobs
);

module.exports = router;