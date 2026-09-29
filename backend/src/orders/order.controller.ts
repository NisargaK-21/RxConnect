import {Request,Response} from "express";
import orderService from "./order.service";
import {
    placeManualOrder,
} from "./manualOrder.service";

const createOrder = async (req:Request, res:Response) => {
    try {
        const { branchId, items } = req.body;

        const result = await orderService.placeOrder(
            req.user.id,
            branchId,
            items
        );

        return res.status(201).json(result);

    } catch (err:any) {

        if (err.message === "OUT_OF_STOCK") {
            const branchSuggestion = err.alternativeBranch;
            const suggestion = {
                branchSuggestion,
                medicineSuggestion: err.substituteMedicine,
                medicineOtherBranchSuggestion: err.substituteOtherBranch,
                originalBranchId: err.originalBranchId,
                originalMedicineId: err.originalMedicineId,
                branchId: branchSuggestion?.branchId,
                branchName: branchSuggestion?.branchName,
            };

            const suggestionOptions:any[] = [];
            if (branchSuggestion) {
                suggestionOptions.push({
                    type: "same_medicine_other_branch",
                    ...branchSuggestion,
                    medicineId: err.originalMedicineId,
                });
            }
            if (err.substituteMedicine) {
                suggestionOptions.push({
                    type: "substitute_same_branch",
                    ...err.substituteMedicine,
                    originalMedicineId: err.originalMedicineId,
                    branchId: err.originalBranchId,
                });
            }
            if (err.substituteOtherBranch) {
                suggestionOptions.push({
                    type: "substitute_other_branch",
                    ...err.substituteOtherBranch,
                    originalMedicineId: err.originalMedicineId,
                });
            }

            // Ensure top-level suggestion fields are populated for older frontend
            // code paths that expect `medicineSuggestion` and
            // `medicineOtherBranchSuggestion` directly on the suggestion object.
            if (!suggestion.medicineSuggestion) {
                const sameBranchSub = suggestionOptions.find((s) => s.type === "substitute_same_branch");
                if (sameBranchSub) suggestion.medicineSuggestion = sameBranchSub;
            }
            if (!suggestion.medicineOtherBranchSuggestion) {
                const otherBranchSub = suggestionOptions.find((s) => s.type === "substitute_other_branch");
                if (otherBranchSub) suggestion.medicineOtherBranchSuggestion = otherBranchSub;
            }

            return res.status(409).json({
                success: false,
                substitutionRequired: true,
                message: "Medicine is out of stock.",
                orderId: err.orderId,
                orderItemId: err.orderItemId,
                ...suggestion,
                suggestion,
                suggestionOptions,
            });
        }

        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const updateStatus = async (req:Request, res:Response) => {
    try {
        const { id } = req.params;
        const orderId=Number(id);
        const { status } = req.body;
        const userRole = req.user?.role || null;

        const normalizedStatus = String(status || "").toLowerCase();
        if ((normalizedStatus === "out for delivery" || normalizedStatus === "delivered") && userRole !== "delivery" && userRole !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only authorized delivery personnel can mark orders as Out for Delivery or Delivered.",
            });
        }

        const result = await orderService.updateOrderStatus(orderId, status, userRole);

        return res.status(200).json(result);

    } catch (err:any) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const cancelCustomerOrder = async (req:Request, res:Response) => {
    try {
        const { id } = req.params;
        const orderId = Number(id);
        const customerId = req.user?.id || req.body?.customerId || null;
        const result = await orderService.cancelOrder(orderId, customerId);

        return res.status(200).json(result);

    } catch (err:any) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const cancelCustomerOrderItem = async (req:Request, res:Response) => {
    try {
        const { id, itemId } = req.params;
        const orderId = Number(id);
        const orderItemId = Number(itemId);
        const customerId = req.user?.id || req.body?.customerId || null;
        const result = await orderService.cancelOrderItem(orderId, orderItemId, customerId);

        return res.status(200).json(result);

    } catch (err:any) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const updateOrderBranch = async (req:Request, res:Response) => {
    try {
        const { id } = req.params;
        const orderId = Number(id);
        const { branchId } = req.body;
        const user = req.user;

        if (user && user.role === "customer") {
            const existingOrder = await orderService.getOrderById(orderId);
            if (String(existingOrder.order.customer_id) !== String(user.id)) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You cannot modify another user's order",
                });
            }
        }

        const result = await orderService.changeOrderBranch(
            orderId,
            branchId
        );

        return res.status(200).json(result);

    } catch (err:any) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const fetchCustomerOrders = async (req:Request, res:Response) => {
    try {
        const { customerId } = req.params;
        const customerIdNumber = Number(customerId);
        const user = req.user;

        if (user && user.role === "customer" && String(user.id) !== String(customerId)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You cannot access another user's orders",
            });
        }

        const result = await orderService.getCustomerOrders(customerIdNumber);

        return res.status(200).json(result);

    } catch (err:any) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const acceptOrderSubstitution = async (req:Request, res:Response) => {
    try {
        const { id } = req.params;
        const orderId = Number(id);
        const user = req.user;

        if (user && user.role === "customer") {
            const existingOrder = await orderService.getOrderById(orderId);
            if (String(existingOrder.order.customer_id) !== String(user.id)) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You cannot modify another user's order",
                });
            }
        }

        const {
            orderItemId,
            branchId,
            medicineId
        } = req.body;

        const result = await orderService.acceptSubstitution(
            orderId,
            orderItemId,
            branchId,
            medicineId
        );

        res.status(200).json(result);

    } catch (err:any) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

const rejectOrderSubstitution = async (req:Request, res:Response) => {
    try {
        const { id } = req.params;
        const orderId = Number(id);
        const user = req.user;

        if (user && user.role === "customer") {
            const existingOrder = await orderService.getOrderById(orderId);
            if (String(existingOrder.order.customer_id) !== String(user.id)) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You cannot modify another user's order",
                });
            }
        }

        const { orderItemId } = req.body;
        const result = await orderService.rejectSubstitution(
            orderId,
            orderItemId
        );

        return res.status(200).json(result);
    } catch (err:any) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const fetchOrderById = async (req:Request, res:Response) => {
    try {
        const { id } = req.params;
        const orderId = Number(id);
        const user = req.user;

        const result = await orderService.getOrderById(orderId);

        if (user && user.role === "customer" && String(result.order.customer_id) !== String(user.id)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You cannot access another user's order",
            });
        }

        return res.status(200).json(result);

    } catch (err:any) {
        return res.status(404).json({
            success: false,
            message: err.message,
        });
    }
};

const createManualOrder = async (req:Request, res:Response) => {
    try {
        const { customerId, branchId, medicineId, quantity } = req.body;

        const result = await placeManualOrder(
            customerId,
            branchId,
            medicineId,
            quantity
        );

        return res.status(201).json(result);

    } catch (err:any) {
        return res.status(400).json({
            success: false,
            message: err.message,
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