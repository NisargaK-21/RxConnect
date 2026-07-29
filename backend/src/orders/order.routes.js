const express = require("express");
const router = express.Router();

const { createOrder } = require("./order.controller");

router.post("/", createOrder);

module.exports = router;