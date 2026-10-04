import express, { Router } from "express";
import authenticate from "../middleware/auth.middleware";
import authorize from "../middleware/role.middleware";

import {
  createOrder,
  updateStatus,
  cancelCustomerOrder,
  cancelCustomerOrderItem,
  updateOrderBranch,
  acceptOrderSubstitution,
  rejectOrderSubstitution,
  createManualOrder,
  fetchCustomerOrders,
  fetchOrderById,
} from "./order.controller";

const router: Router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("customer"),
  createOrder
);

router.get(
  "/customer/:customerId",
  fetchCustomerOrders
);

router.get(
  "/:id",
  fetchOrderById
);

router.patch(
  "/:id/status",
  authenticate,
  authorize(
    "pharmacist",
    "staff",
    "delivery"
  ),
  updateStatus
);

router.patch(
  "/:id/cancel",
  authenticate,
  authorize("customer"),
  cancelCustomerOrder
);

router.delete(
  "/:id/items/:itemId",
  authenticate,
  authorize("customer"),
  cancelCustomerOrderItem
);

router.patch(
  "/:id/items/:itemId/cancel",
  authenticate,
  authorize("customer"),
  cancelCustomerOrderItem
);

router.post(
  "/manual",
  authenticate,
  authorize("staff", "pharmacist"),
  createManualOrder
);

router.patch(
  "/:id/change-branch",
  updateOrderBranch
);

router.patch(
  "/:id/accept-substitution",
  acceptOrderSubstitution
);

router.patch(
  "/:id/reject-substitution",
  rejectOrderSubstitution
);

export default router;