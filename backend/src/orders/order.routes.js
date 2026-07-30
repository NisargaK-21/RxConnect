const express = require("express");
const router = express.Router();

const {
    createOrder,
    updateStatus,
    cancelCustomerOrder,
  createManualOrder,
} = require("./order.controller");


router.post("/", createOrder);
router.patch("/:id/status", updateStatus); 
router.patch("/:id/cancel", cancelCustomerOrder);
router.post("/manual", createManualOrder);

module.exports = router;