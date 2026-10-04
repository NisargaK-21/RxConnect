import express, { Router } from "express";
import {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from "./branch.controller";
import { getRecurringFulfillmentFailures } from "../dashboard/dashboard.controller";
import authenticate from "../middleware/auth.middleware";
import authorize from "../middleware/role.middleware";

const router: Router = express.Router();

router.post("/", authenticate, authorize("admin"), createBranch);
router.put("/:id", authenticate, authorize("admin"), updateBranch);
router.delete("/:id", authenticate, authorize("admin"), deleteBranch);

router.get("/fulfillment-failures", authenticate, authorize("admin"), getRecurringFulfillmentFailures);

router.get("/", authenticate, getAllBranches);
router.get("/:id", authenticate, getBranchById);

export default router;