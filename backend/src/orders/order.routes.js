const express = require("express");
const router = express.Router();

const {
    createOrder,

    updateStatus,
  createManualOrder,
} = require("./order.controller");


router.post("/", createOrder);
router.patch("/:id/status", updateStatus); 
router.post("/manual", createManualOrder);

module.exports = router;