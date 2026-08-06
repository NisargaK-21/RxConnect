const {
  getTodaysOrdersPerBranch,
  getLowStockPerBranch,
  getBranchFulfillmentRate,
  logFulfillmentFailure,
  getRecurringFulfillmentFailures,
} = require("./dashboard.service");

const getDashboard = async (req, res) => {
  try {
    const data = await getTodaysOrdersPerBranch();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getLowStockDashboard = async (req, res) => {
  try {
    const data = await getLowStockPerBranch();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const validateDateInput = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw Object.assign(new Error(`${fieldName} must be a valid date`), {
      statusCode: 400,
    });
  }

  const trimmedValue = value.trim();
  const parsedDate = new Date(`${trimmedValue}T00:00:00`);
  const normalizedDate = parsedDate.toISOString().slice(0, 10);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue) ||
    Number.isNaN(parsedDate.getTime()) ||
    normalizedDate !== trimmedValue
  ) {
    throw Object.assign(new Error(`${fieldName} must be in YYYY-MM-DD format`), {
      statusCode: 400,
    });
  }

  return trimmedValue;
};

const getFulfillmentDashboard = async (req, res) => {
  try {
    const startDate = validateDateInput(req.query.startDate, "startDate");
    const endDate = validateDateInput(req.query.endDate, "endDate");

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be after endDate",
      });
    }

    const data = await getBranchFulfillmentRate({ startDate, endDate });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const getRecurringFulfillmentFailuresController = async (req, res) => {
  try {
    let threshold = 3;
    if (req.query.threshold !== undefined && req.query.threshold !== "") {
      threshold = Number(req.query.threshold);
      if (Number.isNaN(threshold) || threshold < 0) {
        return res.status(400).json({
          success: false,
          message: "threshold must be a non-negative number",
        });
      }
    }

    const startDate = validateDateInput(req.query.startDate, "startDate");
    const endDate = validateDateInput(req.query.endDate, "endDate");

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be after endDate",
      });
    }

    const data = await getRecurringFulfillmentFailures({
      threshold,
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

const recordFulfillmentFailureController = async (req, res) => {
  try {
    const { branchId, medicineId, orderId, failureReason } = req.body;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "branchId is required",
      });
    }

    const failureLog = await logFulfillmentFailure({
      branchId,
      medicineId,
      orderId,
      failureReason,
    });

    return res.status(201).json({
      success: true,
      data: failureLog,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getDashboard,
  getLowStockDashboard,
  getFulfillmentDashboard,
  getRecurringFulfillmentFailures: getRecurringFulfillmentFailuresController,
  recordFulfillmentFailure: recordFulfillmentFailureController,
};