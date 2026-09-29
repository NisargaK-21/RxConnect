import express from "express";
import branchController from "./branch.controller";
import {
  getRecurringFulfillmentFailures,
} from "../dashboard/dashboard.controller";
import authenticate from "../middleware/auth.middleware";
import authorize from "../middleware/role.middleware";
const router = express.Router();


router.post("/", authenticate, authorize("admin"), branchController.createBranch);
router.put("/:id", authenticate, authorize("admin"), branchController.updateBranch);
router.delete("/:id", authenticate, authorize("admin"), branchController.deleteBranch);

router.get("/fulfillment-failures", authenticate, authorize("admin"), getRecurringFulfillmentFailures);

router.get("/", authenticate, branchController.getAllBranches);
router.get("/:id", authenticate, branchController.getBranchById);


export default router;