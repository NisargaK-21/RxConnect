const express = require("express");
const router = express.Router();

const {
    createOrder,
    createManualOrder,
} = require("./order.controller");

router.post("/", createOrder);
router.post("/manual", createManualOrder);

module.exports = router;