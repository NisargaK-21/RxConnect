import type { Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number | string;
    role?: string;
    [key: string]: unknown;
  };
}

interface OrderServiceError extends Error {
  alternativeBranch?: unknown;
  substituteMedicine?: unknown;
  substituteOtherBranch?: unknown;
  originalBranchId?: number | string;
  originalMedicineId?: number | string;
  orderId?: number | string;
  orderItemId?: number | string;
}

const orderService = require("./order.service");

const {
  placeManualOrder,
} = require("./manualOrder.service");

const createOrder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      branchId,
      items,
    } = req.body;

    const result = await orderService.placeOrder(
      req.user?.id,
      branchId,
      items
    );

    return res.status(201).json(result);
  } catch (err: unknown) {
    const error = err as OrderServiceError;

    if (error.message === "OUT_OF_STOCK") {
      const branchSuggestion =
        error.alternativeBranch;

      const suggestion = {
        branchSuggestion,
        medicineSuggestion:
          error.substituteMedicine,
        medicineOtherBranchSuggestion:
          error.substituteOtherBranch,
        originalBranchId:
          error.originalBranchId,
        originalMedicineId:
          error.originalMedicineId,
        branchId:
          (branchSuggestion as any)?.branchId,
        branchName:
          (branchSuggestion as any)?.branchName,
      };

      const suggestionOptions: any[] = [];

      if (branchSuggestion) {
        suggestionOptions.push({
          type: "same_medicine_other_branch",
          ...(branchSuggestion as object),
          medicineId:
            error.originalMedicineId,
        });
      }

      if (error.substituteMedicine) {
        suggestionOptions.push({
          type: "substitute_same_branch",
          ...(error.substituteMedicine as object),
          originalMedicineId:
            error.originalMedicineId,
          branchId:
            error.originalBranchId,
        });
      }

      if (error.substituteOtherBranch) {
        suggestionOptions.push({
          type: "substitute_other_branch",
          ...(error.substituteOtherBranch as object),
          originalMedicineId:
            error.originalMedicineId,
        });
      }

      if (!suggestion.medicineSuggestion) {
        const sameBranchSub =
          suggestionOptions.find(
            (item) =>
              item.type ===
              "substitute_same_branch"
          );

        if (sameBranchSub) {
          suggestion.medicineSuggestion =
            sameBranchSub;
        }
      }

      if (
        !suggestion.medicineOtherBranchSuggestion
      ) {
        const otherBranchSub =
          suggestionOptions.find(
            (item) =>
              item.type ===
              "substitute_other_branch"
          );

        if (otherBranchSub) {
          suggestion.medicineOtherBranchSuggestion =
            otherBranchSub;
        }
      }

      return res.status(409).json({
        success: false,
        substitutionRequired: true,
        message: "Medicine is out of stock.",
        orderId: error.orderId,
        orderItemId: error.orderItemId,
        ...suggestion,
        suggestion,
        suggestionOptions,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const userRole =
      req.user?.role || null;

    const normalizedStatus =
      String(status || "").toLowerCase();

    if (
      (
        normalizedStatus ===
          "out for delivery" ||
        normalizedStatus === "delivered"
      ) &&
      userRole !== "delivery" &&
      userRole !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only authorized delivery personnel can mark orders as Out for Delivery or Delivered.",
      });
    }

    const result =
      await orderService.updateOrderStatus(
        id,
        status,
        userRole
      );

    return res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as OrderServiceError;

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const cancelCustomerOrder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const customerId =
      req.user?.id ||
      req.body?.customerId ||
      null;

    const result =
      await orderService.cancelOrder(
        id,
        customerId
      );

    return res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as OrderServiceError;

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const cancelCustomerOrderItem = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      id,
      itemId,
    } = req.params;

    const customerId =
      req.user?.id ||
      req.body?.customerId ||
      null;

    const result =
      await orderService.cancelOrderItem(
        id,
        itemId,
        customerId
      );

    return res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as OrderServiceError;

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOrderBranch = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { branchId } = req.body;
    const user = req.user;

    if (
      user &&
      user.role === "customer"
    ) {
      const existingOrder =
        await orderService.getOrderById(id);

      if (
        String(
          existingOrder.order.customer_id
        ) !== String(user.id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: You cannot modify another user's order",
        });
      }
    }

    const result =
      await orderService.changeOrderBranch(
        id,
        branchId
      );

    return res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as OrderServiceError;

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const fetchCustomerOrders = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { customerId } =
      req.params;

    const user = req.user;

    if (
      user &&
      user.role === "customer" &&
      String(user.id) !==
        String(customerId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You cannot access another user's orders",
      });
    }

    const result =
      await orderService.getCustomerOrders(
        customerId
      );

    return res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as OrderServiceError;

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const acceptOrderSubstitution = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (
      user &&
      user.role === "customer"
    ) {
      const existingOrder =
        await orderService.getOrderById(id);

      if (
        String(
          existingOrder.order.customer_id
        ) !== String(user.id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: You cannot modify another user's order",
        });
      }
    }

    const {
      orderItemId,
      branchId,
      medicineId,
    } = req.body;

    const result =
      await orderService.acceptSubstitution(
        id,
        orderItemId,
        branchId,
        medicineId
      );

    return res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as OrderServiceError;

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const rejectOrderSubstitution = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (
      user &&
      user.role === "customer"
    ) {
      const existingOrder =
        await orderService.getOrderById(id);

      if (
        String(
          existingOrder.order.customer_id
        ) !== String(user.id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: You cannot modify another user's order",
        });
      }
    }

    const { orderItemId } =
      req.body;

    const result =
      await orderService.rejectSubstitution(
        id,
        orderItemId
      );

    return res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as OrderServiceError;

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const fetchOrderById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const result =
      await orderService.getOrderById(id);

    if (
      user &&
      user.role === "customer" &&
      String(result.order.customer_id) !==
        String(user.id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You cannot access another user's order",
      });
    }

    return res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as OrderServiceError;

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const createManualOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      customerId,
      branchId,
      medicineId,
      quantity,
    } = req.body;

    const result =
      await placeManualOrder(
        customerId,
        branchId,
        medicineId,
        quantity
      );

    return res.status(201).json(result);
  } catch (err: unknown) {
    const error = err as OrderServiceError;

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createOrder,
  updateStatus,
  cancelCustomerOrder,
  cancelCustomerOrderItem,
  updateOrderBranch,
  acceptOrderSubstitution,
  rejectOrderSubstitution,
  createManualOrder,
  fetchCustomerOrders,
  fetchOrderById,
};