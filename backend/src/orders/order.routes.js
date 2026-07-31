const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const {
    createOrder,
    updateStatus,
    cancelCustomerOrder,
    fetchCustomerOrders,
    fetchOrderById,
    createManualOrder,
} = require("./order.controller");


router.post(
    "/",
    authenticate,
    authorize("customer"),
    createOrder
);
router.get("/customer/:customerId", fetchCustomerOrders);
router.get("/:id", fetchOrderById);
router.patch("/:id/status", updateStatus); 
router.patch("/:id/cancel", cancelCustomerOrder);
router.post("/manual", createManualOrder);

module.exports = router;