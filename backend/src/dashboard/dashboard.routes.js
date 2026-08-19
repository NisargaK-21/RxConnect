const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const {
  getDashboard,
  getLowStockDashboard,
  getFulfillmentDashboard,
  getRecurringFulfillmentFailures,
  recordFulfillmentFailure,
} = require("./dashboard.controller");

router.use(authenticate);
router.use(authorize("admin", "pharmacist", "staff"));

router.get("/", getDashboard);
router.get("/lowstock", getLowStockDashboard);
router.get("/fulfillment", getFulfillmentDashboard);

router.get("/recurring-failures", getRecurringFulfillmentFailures);
router.get("/fulfillment-failures", getRecurringFulfillmentFailures);
router.get("/failures", getRecurringFulfillmentFailures);
router.post("/fulfillment-failures", recordFulfillmentFailure);

module.exports = router;