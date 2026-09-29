import express from "express";
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

import upload from "./upload.middleware";
import authenticate from"../middleware/auth.middleware";
import authorize from "../middleware/role.middleware";
import {
  validatePrescriptionUpload,
} from "./prescription.validation";
const router = express.Router();

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
  authorize("pharmacist", "admin", "staff"),
  getPendingPrescriptions
);

router.patch(
  "/:id/review",
  authenticate,
  authorize("pharmacist", "admin", "staff"),
  reviewPrescription
);

router.post(
  "/:id/verify",
  authenticate,
  authorize("pharmacist", "admin", "staff"),
  verifyPrescription
);

router.get(
  "/orders/:orderId/verification-logs",
  authenticate,
  authorize("pharmacist", "admin", "staff"),
  getVerificationLogsByOrder
);

router.get(
  "/:id",
  authenticate,
  authorize("pharmacist", "admin", "staff"),
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