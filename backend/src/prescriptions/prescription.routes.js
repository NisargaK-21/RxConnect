const express = require("express");
const router = express.Router();

const prescriptionController = require("./prescription.controller");
const upload = require("./upload.middleware");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const {
  validatePrescriptionUpload,
} = require("./prescription.validation");

router.post(
  "/upload",
  authenticate,
  authorize("customer", "admin", "staff"),
  upload.single("prescription"),
  validatePrescriptionUpload,
  prescriptionController.uploadPrescription
);

router.get(
  "/pending",
  authenticate,
  authorize("pharmacist", "admin", "staff"),
  prescriptionController.getPendingPrescriptions
);

router.patch(
  "/:id/review",
  authenticate,
  authorize("pharmacist", "admin", "staff"),
  prescriptionController.reviewPrescription
);

router.get(
  "/orders/:orderId/verification-logs",
  authenticate,
  authorize("pharmacist", "admin", "staff"),
  prescriptionController.getVerificationLogsByOrder
);

router.get(
  "/:id",
  authenticate,
  authorize("pharmacist", "admin", "staff"),
  prescriptionController.getPrescriptionById
);

router.patch(
  "/:id/standing",
  authenticate,
  authorize("pharmacist", "admin"),
  prescriptionController.updateStandingApproval
);

router.post(
  "/release-expired-holds",
  authenticate,
  authorize("admin", "pharmacist", "staff"),
  prescriptionController.releaseExpiredHolds
);

module.exports = router;