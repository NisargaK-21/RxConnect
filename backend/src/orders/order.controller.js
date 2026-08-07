const {
    placeOrder,
    updateOrderStatus,
    cancelOrder,
    cancelOrderItem,
    changeOrderBranch,
    acceptSubstitution,
    rejectSubstitution,
    getCustomerOrders,
    getOrderById,
} = require("./order.service");
const {
    placeManualOrder,
} = require("./manualOrder.service");

const createOrder = async (req, res) => {
    try {
        const { branchId, items } = req.body;

        const result = await placeOrder(
            req.user.id,
            branchId,
            items
        );

        return res.status(201).json(result);

    } catch (err) {

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

            const suggestionOptions = [];
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

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userRole = req.user?.role || null;

        const result = await updateOrderStatus(id, status, userRole);

        return res.status(200).json(result);

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const cancelCustomerOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.user?.id || req.body?.customerId || null;
        const result = await cancelOrder(id, customerId);

        return res.status(200).json(result);

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const cancelCustomerOrderItem = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const customerId = req.user?.id || req.body?.customerId || null;
        const result = await cancelOrderItem(id, itemId, customerId);

        return res.status(200).json(result);

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const updateOrderBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { branchId } = req.body;

        const result = await changeOrderBranch(
            id,
            branchId
        );

        return res.status(200).json(result);

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const fetchCustomerOrders = async (req, res) => {
    try {
        const { customerId } = req.params;

        const result = await getCustomerOrders(customerId);

        return res.status(200).json(result);

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const acceptOrderSubstitution = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            orderItemId,
            branchId,
            medicineId
        } = req.body;

        const result = await acceptSubstitution(
            id,
            orderItemId,
            branchId,
            medicineId
        );

        res.status(200).json(result);

    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

const rejectOrderSubstitution = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderItemId } = req.body;
        const result = await rejectSubstitution(
            id,
            orderItemId
        );

        return res.status(200).json(result);
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

const fetchOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await getOrderById(id);

        return res.status(200).json(result);

    } catch (err) {
        return res.status(404).json({
            success: false,
            message: err.message,
        });
    }
};

const createManualOrder = async (req, res) => {
    try {
        const { customerId, branchId, medicineId, quantity } = req.body;

        const result = await placeManualOrder(
            customerId,
            branchId,
            medicineId,
            quantity
        );

        return res.status(201).json(result);

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

module.exports = {
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