const express = require("express");
const router = express.Router();

const prescriptionController = require("./prescription.controller");
const upload = require("./upload.middleware");
const {
  validatePrescriptionUpload,
} = require("./prescription.validation");

router.post(
  "/upload",
  upload.single("prescription"),
  validatePrescriptionUpload,
  prescriptionController.uploadPrescription
);

module.exports = router;