const prescriptionService = require("./prescription.service");
const pool = require("../database/db");
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
const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prescription = await prescriptionService.getPrescriptionById(id);

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      data: prescription,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const getPendingPrescriptions = async (req, res) => {
  try {
    const branchId = req.user.branch_id;

    const queue = await prescriptionService.getPendingPrescriptions(branchId);

    return res.status(200).json({
      success: true,
      data: queue,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
module.exports = {
  uploadPrescription,
  getPrescriptionById,
  getPendingPrescriptions,
};