const {
    placeOrder,
    updateOrderStatus,
    cancelOrder,
    changeOrderBranch,
    acceptSubstitution,
    rejectSubstitution
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

        return res.status(409).json({
            success: false,
            substitutionRequired: true,
            message: "Medicine is out of stock.",

            orderId: err.orderId,
            orderItemId: err.orderItemId,

            branchSuggestion: err.alternativeBranch,
            medicineSuggestion: err.substituteMedicine,
            medicineOtherBranchSuggestion:
                err.substituteOtherBranch
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

        const result = await updateOrderStatus(id, status);

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
        const customerId = req.body?.customerId ?? null;
        const result = await cancelOrder(id, customerId);

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
    updateOrderBranch,
    acceptOrderSubstitution,
    rejectOrderSubstitution,
    createManualOrder
};
    fetchCustomerOrders,
    fetchOrderById,
    createManualOrder,
};
