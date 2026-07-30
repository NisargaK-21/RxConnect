const {
  getTodaysOrdersPerBranch,
  getLowStockPerBranch,
  getBranchFulfillmentRate
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

const getFulfillmentDashboard = async (req, res) => {
  try {
    const data = await getBranchFulfillmentRate();

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

module.exports = {
  getDashboard,
  getLowStockDashboard,
  getFulfillmentDashboard
};