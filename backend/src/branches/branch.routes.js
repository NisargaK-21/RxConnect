const express = require("express");
const router = express.Router();

const {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} = require("./branch.controller");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

router.post("/", authenticate, authorize("admin"), createBranch);
router.put("/:id", authenticate, authorize("admin"), updateBranch);
router.delete("/:id", authenticate, authorize("admin"), deleteBranch);

router.get("/", authenticate, getAllBranches);
router.get("/:id", authenticate, getBranchById);


module.exports = router;