const express = require("express");
const router = express.Router();

const {
    createOrder,
    updateStatus
} = require("./order.controller");

router.post("/", createOrder);
router.patch("/:id/status", updateStatus);

module.exports = router;