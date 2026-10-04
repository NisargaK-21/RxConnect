import express, { Router } from "express";

import {
  uploadPrescription,
  getPendingPrescriptions,
  reviewPrescription,
  verifyPrescription,
  getVerificationLogsByOrder,
  getPrescriptionById,
  updateStandingApproval,
  releaseExpiredHolds,
} from "./prescription.controller";

const upload = require("./upload.middleware");

const authenticate = require("../middleware/auth.middleware");

const authorize = require("../middleware/role.middleware");

const {
  validatePrescriptionUpload,
} = require("./prescription.validation");

const router: Router = express.Router();

router.post(
  "/upload",
  authenticate,
  authorize("customer", "staff"),
  upload.single("prescription"),
  validatePrescriptionUpload,
  uploadPrescription
);

router.get(
  "/pending",
  authenticate,
  authorize(
    "pharmacist",
    "admin",
    "staff"
  ),
  getPendingPrescriptions
);

router.patch(
  "/:id/review",
  authenticate,
  authorize(
    "pharmacist",
    "admin",
    "staff"
  ),
  reviewPrescription
);

router.post(
  "/:id/verify",
  authenticate,
  authorize(
    "pharmacist",
    "admin",
    "staff"
  ),
  verifyPrescription
);

router.get(
  "/orders/:orderId/verification-logs",
  authenticate,
  authorize(
    "pharmacist",
    "admin",
    "staff"
  ),
  getVerificationLogsByOrder
);

router.get(
  "/:id",
  authenticate,
  authorize(
    "pharmacist",
    "admin",
    "staff"
  ),
  getPrescriptionById
);

router.patch(
  "/:id/standing",
  authenticate,
  authorize("pharmacist"),
  updateStandingApproval
);

router.post(
  "/release-expired-holds",
  authenticate,
  authorize("pharmacist", "staff"),
  releaseExpiredHolds
);

export default router;