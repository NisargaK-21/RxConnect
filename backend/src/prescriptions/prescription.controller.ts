import type {
  Request,
  Response,
} from "express";

import path from "path";

const prescriptionService = require("./prescription.service");

interface AuthenticatedUser {
  id: number | string;
  branch_id?: number | string | null;
  role?: string;
  [key: string]: unknown;
}

interface ServiceError extends Error {
  [key: string]: unknown;
}

const getAuthenticatedUser = (
  req: Request
): AuthenticatedUser => {
  return (req as Request & {
    user: AuthenticatedUser;
  }).user;
};

const uploadPrescription = async (
  req: Request,
  res: Response
) => {
  try {
    const { orderItemId } = req.body;

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "Prescription file is required",
      });
    }

    const user = getAuthenticatedUser(req);

    const fileUrl = path.posix.join(
      "uploads",
      file.filename
    );

    const prescription =
      await prescriptionService.uploadPrescription(
        orderItemId,
        fileUrl,
        user.id
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
  } catch (error: unknown) {
    const err = error as ServiceError;

    console.error(err);

    if (
      typeof err.message === "string" &&
      err.message.includes("not authorized")
    ) {
      return res.status(403).json({
        message: err.message,
      });
    }

    if (
      typeof err.message === "string" &&
      (
        err.message.includes("not found") ||
        err.message.includes("already uploaded") ||
        err.message.includes(
          "does not require a prescription"
        )
      )
    ) {
      return res.status(400).json({
        message: err.message,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getPrescriptionById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const prescription =
      await prescriptionService.getPrescriptionById(id);

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      data: prescription,
    });
  } catch (error: unknown) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getPendingPrescriptions = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getAuthenticatedUser(req);

    const branchId = user.branch_id;

    const page =
      typeof req.query.page === "string"
        ? parseInt(req.query.page, 10) || 1
        : 1;

    const limit =
      typeof req.query.limit === "string"
        ? parseInt(req.query.limit, 10) || 10
        : 10;

    const sort =
      req.query.sort === "asc"
        ? "ASC"
        : "DESC";

    const queue =
      await prescriptionService.getPendingPrescriptions(
        branchId,
        page,
        limit,
        sort
      );

    return res.status(200).json({
      success: true,
      data: queue,
    });
  } catch (error: unknown) {
    const err = error as ServiceError;

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const reviewPrescription = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getAuthenticatedUser(req);

    const { id } = req.params;
    const { status } = req.body;

    if (
      !["approved", "rejected"].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Status must be approved or rejected",
      });
    }

    const prescription =
      await prescriptionService.reviewPrescription(
        id,
        user.id,
        status
      );

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      message:
        `Prescription ${status} successfully`,
      data: prescription,
    });
  } catch (error: unknown) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateStandingApproval = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getAuthenticatedUser(req);

    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message:
          "isActive must be true or false",
      });
    }

    const result =
      await prescriptionService.updateStandingApproval(
        id,
        user.id,
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
  } catch (error: unknown) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getVerificationLogsByOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const { orderId } = req.params;

    const logs =
      await prescriptionService.getVerificationLogsByOrder(
        orderId
      );

    return res.status(200).json({
      message:
        "Verification logs fetched successfully",
      data: logs,
    });
  } catch (error: unknown) {
    const err = error as ServiceError;

    console.error(error);

    return res.status(500).json({
      message: err.message,
    });
  }
};

const releaseExpiredHolds = async (
  req: Request,
  res: Response
) => {
  try {
    const timeoutMinutes =
      typeof req.body.timeoutMinutes === "number"
        ? req.body.timeoutMinutes
        : parseInt(
            req.body.timeoutMinutes,
            10
          ) || 60;

    const releasedOrders =
      await prescriptionService.releaseExpiredPrescriptionHolds(
        timeoutMinutes
      );

    return res.status(200).json({
      message:
        "Expired prescription holds released successfully",
      releasedOrdersCount:
        releasedOrders.length,
      releasedOrders,
    });
  } catch (error: unknown) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const verifyPrescription = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getAuthenticatedUser(req);

    const { id } = req.params;

    const {
      status,
      decision,
      action,
      verified,
    } = req.body;

    let targetStatus:
      | "approved"
      | "rejected"
      | null = null;

    const inputStr = String(
      status ||
        decision ||
        action ||
        ""
    ).toLowerCase();

    if (
      inputStr === "approved" ||
      inputStr === "verified" ||
      inputStr === "verify" ||
      inputStr === "approve"
    ) {
      targetStatus = "approved";
    } else if (
      inputStr === "rejected" ||
      inputStr === "reject"
    ) {
      targetStatus = "rejected";
    } else if (
      typeof verified === "boolean"
    ) {
      targetStatus = verified
        ? "approved"
        : "rejected";
    }

    if (!targetStatus) {
      return res.status(400).json({
        success: false,
        message:
          "Status, decision, or action must be approved/verified or rejected",
      });
    }

    const prescription =
      await prescriptionService.reviewPrescription(
        id,
        user.id,
        targetStatus
      );

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message:
          "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        `Prescription ${targetStatus} successfully`,
      data: prescription,
    });
  } catch (error: unknown) {
    const err = error as ServiceError;

    console.error(error);

    if (
      typeof err.message === "string" &&
      err.message.includes("not found")
    ) {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Internal server error",
    });
  }
};

export {
  uploadPrescription,
  getPrescriptionById,
  getPendingPrescriptions,
  reviewPrescription,
  updateStandingApproval,
  getVerificationLogsByOrder,
  releaseExpiredHolds,
  verifyPrescription,
};