const validatePrescriptionUpload = (req, res, next) => {
  const { orderItemId } = req.body;

  if (!orderItemId) {
    return res.status(400).json({
      message: "orderItemId is required",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      message: "Prescription file is required",
    });
  }

  next();
};

module.exports = {
  validatePrescriptionUpload,
};