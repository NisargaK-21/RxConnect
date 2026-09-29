import express from"express";
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
} from "./order.controller";import authenticate from"../middleware/auth.middleware";
import authorize from"../middleware/role.middleware";
const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("customer"),
    createOrder
);
router.get(
    "/customer/:customerId",
    authenticate,
    authorize("customer", "pharmacist", "staff", "admin"),
    fetchCustomerOrders
);
router.get(
    "/:id",
    authenticate,
    authorize("customer", "pharmacist", "staff", "admin", "delivery"),
    fetchOrderById
);
router.patch(
    "/:id/status",
    authenticate,
    authorize("pharmacist", "staff", "delivery"),
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
    authenticate,
    authorize("customer", "pharmacist", "staff", "admin"),
    updateOrderBranch
);
router.patch(
    "/:id/accept-substitution",
    authenticate,
    authorize("customer", "pharmacist", "staff", "admin"),
    acceptOrderSubstitution
);
router.patch(
    "/:id/reject-substitution",
    authenticate,
    authorize("customer", "pharmacist", "staff", "admin"),
    rejectOrderSubstitution
);

export default router;