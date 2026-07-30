const express = require("express");
const router = express.Router();

const {
  getDashboard,
  getLowStockDashboard
} = require("./dashboard.controller");

router.get("/", getDashboard);
router.get("/lowstock", getLowStockDashboard);

module.exports = router;