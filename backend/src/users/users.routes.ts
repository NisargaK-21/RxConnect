import express, { Router } from "express";
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getProfile,
  updateProfile,
} from "./users.controller";
import authenticate from "../middleware/auth.middleware";
import authorize from "../middleware/role.middleware";

const router: Router = express.Router();

router.post(
  "/staff",
  authenticate,
  authorize("admin"),
  createStaff
);

router.get(
  "/staff",
  authenticate,
  authorize("admin"),
  getAllStaff
);

router.get(
  "/staff/:id",
  authenticate,
  authorize("admin"),
  getStaffById
);

router.put(
  "/staff/:id",
  authenticate,
  authorize("admin"),
  updateStaff
);

router.delete(
  "/staff/:id",
  authenticate,
  authorize("admin"),
  deleteStaff
);

router.get(
  "/profile",
  authenticate,
  getProfile
);

router.put(
  "/profile",
  authenticate,
  updateProfile
);

export default router;