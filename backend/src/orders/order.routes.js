const express = require("express");
const router = express.Router();

const {
    createOrder,
    updateStatus,
    cancelCustomerOrder,
    updateOrderBranch,
    acceptOrderSubstitution,
    rejectOrderSubstitution,
    createManualOrder
} = require("./order.controller");


router.post("/", createOrder);
router.patch("/:id/status", updateStatus); 
router.patch("/:id/cancel", cancelCustomerOrder);
router.post("/manual", createManualOrder);
router.patch("/:id/change-branch", updateOrderBranch);
router.patch( "/:id/accept-substitution", acceptOrderSubstitution);
router.patch("/:id/reject-substitution", rejectOrderSubstitution);

module.exports = router;