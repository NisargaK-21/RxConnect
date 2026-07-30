const {
  getTodaysOrdersPerBranch,
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

module.exports = {
  getDashboard,
};