const express = require("express");
const router = express.Router();

const {
  getDashboard,
  getLowStockDashboard,
  getFulfillmentDashboard,
} = require("./dashboard.controller");

router.get("/", getDashboard);
router.get("/lowstock", getLowStockDashboard);
router.get("/fulfillment", getFulfillmentDashboard);

module.exports = router;