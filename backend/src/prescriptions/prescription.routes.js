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
  upload.single("prescription"),
  validatePrescriptionUpload,
  prescriptionController.uploadPrescription
);
router.get(
  "/pending",
  authenticate,
  authorize("PHARMACIST"),
  prescriptionController.getPendingPrescriptions
);
router.get(
  "/:id",
  authenticate,
  authorize("PHARMACIST"),
  prescriptionController.getPrescriptionById
);

module.exports = router;