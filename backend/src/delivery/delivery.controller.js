const deliveryService = require("./delivery.service");

const getAvailableJobs = async (req, res) => {
  try {
    const jobs = await deliveryService.getAvailableJobs(req.user);

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const claimJob = async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await deliveryService.claimJob(
      orderId,
      req.user.id
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

const confirmPickup = async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await deliveryService.confirmPickup(
      orderId,
      req.user.id
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};


const getMyJobs = async (req, res) => {
  try {
    const jobs = await deliveryService.getMyJobs(req.user.id);

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getAvailableJobs,
  claimJob,
  confirmPickup,
  getMyJobs,
};