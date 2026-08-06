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
  authorize("customer"),
  upload.single("prescription"),
  validatePrescriptionUpload,
  prescriptionController.uploadPrescription
);
router.get(
  "/pending",
  authenticate,
  authorize("pharmacist"),
  prescriptionController.getPendingPrescriptions
);
router.patch(
  "/:id/review",
  authenticate,
  authorize("pharmacist"),
  prescriptionController.reviewPrescription
);
router.get(
  "/orders/:orderId/verification-logs",
  authenticate,
  authorize("pharmacist"),
  prescriptionController.getVerificationLogsByOrder
);
router.get(
  "/:id",
  authenticate,
  authorize("pharmacist"),
  prescriptionController.getPrescriptionById
);
router.patch(
  "/:id/standing",
  authenticate,
  authorize("pharmacist"),
  prescriptionController.updateStandingApproval
);
module.exports = router;