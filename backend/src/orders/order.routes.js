const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const {
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
} = require("./order.controller");

router.post(
    "/",
    authenticate,
    authorize("customer"),
    createOrder
);
router.get("/customer/:customerId", fetchCustomerOrders);
router.get("/:id", fetchOrderById);
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
router.patch("/:id/change-branch", updateOrderBranch);
router.patch("/:id/accept-substitution", acceptOrderSubstitution);
router.patch("/:id/reject-substitution", rejectOrderSubstitution);

module.exports = router;