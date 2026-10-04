import express, {
  Router,
} from "express";

import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getProfile,
  updateProfile,
} from "./users.controller";

import authMiddleware from "../middleware/auth.middleware";
import roleMiddleware from "../middleware/role.middleware";

const router: Router =
  express.Router();

router.post(
  "/staff",
  authMiddleware,
  roleMiddleware("admin"),
  createStaff
);

router.get(
  "/staff",
  authMiddleware,
  roleMiddleware("admin"),
  getAllStaff
);

router.get(
  "/staff/:id",
  authMiddleware,
  roleMiddleware("admin"),
  getStaffById
);

router.put(
  "/staff/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateStaff
);

router.delete(
  "/staff/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteStaff
);

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

router.put(
  "/profile",
  authMiddleware,
  updateProfile
);

export default router;