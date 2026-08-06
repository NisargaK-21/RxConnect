const path = require("path");
const prescriptionService = require("./prescription.service");
const pool = require("../database/db");
const uploadPrescription = async (req, res) => {
  try {
    const { orderItemId } = req.body;
    const fileUrl = path.posix.join("uploads", req.file.filename);

    const prescription = await prescriptionService.uploadPrescription(
      orderItemId,
      fileUrl,
      req.user?.id
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
    if (error.message.includes("not authorized")) {
      return res.status(403).json({ message: error.message });
    }
    if (
      error.message.includes("not found") ||
      error.message.includes("already uploaded") ||
      error.message.includes("does not require a prescription")
    ) {
      return res.status(400).json({ message: error.message });
    }
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort === "asc" ? "ASC" : "DESC";

    const queue = await prescriptionService.getPendingPrescriptions(
      branchId,
      page,
      limit,
      sort
    );

    return res.status(200).json({
      success: true,
      data: queue,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const reviewPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const prescription =
      await prescriptionService.reviewPrescription(
        id,
        req.user.id,
        status
      );

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      message: `Prescription ${status} successfully`,
      data: prescription,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const updateStandingApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false",
      });
    }

    const result =
      await prescriptionService.updateStandingApproval(
        id,
        req.user.id,
        isActive
      );

    if (!result) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      message: isActive
        ? "Standing approval enabled successfully"
        : "Standing approval revoked successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
const getVerificationLogsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const logs = await prescriptionService.getVerificationLogsByOrder(orderId);

    return res.status(200).json({
      message: "Verification logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};
module.exports = {
  uploadPrescription,
  getPrescriptionById,
  getPendingPrescriptions,
  reviewPrescription,
  updateStandingApproval,
  getVerificationLogsByOrder,

};