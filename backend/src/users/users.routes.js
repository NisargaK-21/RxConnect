const express = require("express");

const router = express.Router();

const {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getProfile,
  updateProfile,
} = require("./users.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

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

module.exports = router;