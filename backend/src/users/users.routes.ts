import express from "express";
const router = express.Router();
import userController from "./users.controller";
import authMiddleware from "../middleware/auth.middleware";
import roleMiddleware from "../middleware/role.middleware";

router.post(
  "/staff",
  authMiddleware,
  roleMiddleware("admin"),
  userController.createStaff
);

router.get(
  "/staff",
  authMiddleware,
  roleMiddleware("admin"),
  userController.getAllStaff
);

router.get(
  "/staff/:id",
  authMiddleware,
  roleMiddleware("admin"),
  userController.getStaffById
);

router.put(
  "/staff/:id",
  authMiddleware,
  roleMiddleware("admin"),
  userController.updateStaff
);

router.delete(
  "/staff/:id",
  authMiddleware,
  roleMiddleware("admin"),
  userController.deleteStaff
);

router.get(
  "/profile",
  authMiddleware,
  userController.getProfile
);

router.put(
  "/profile",
  authMiddleware,
  userController.updateProfile
);

export default router;