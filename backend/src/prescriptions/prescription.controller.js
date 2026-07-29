const prescriptionService = require("./prescription.service");

const uploadPrescription = async (req, res) => {
  try {
    const { orderItemId } = req.body;
    const fileUrl = req.file.path;

    const prescription = await prescriptionService.uploadPrescription(
      orderItemId,
      fileUrl
    );

    if (!prescription) {
      return res.status(404).json({
        message: "Order item not found",
      });
    }

    return res.status(201).json({
      message: "Prescription uploaded successfully",
      data: prescription,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  uploadPrescription,
};