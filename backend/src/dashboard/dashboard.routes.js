const express = require("express");
const router = express.Router();

const {
  getDashboard,
} = require("./dashboard.controller");

router.get("/", getDashboard);

module.exports = router;