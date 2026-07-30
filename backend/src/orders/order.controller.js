const {
    placeOrder,
    updateOrderStatus,
    cancelOrder,
    getCustomerOrders,
    getOrderById,
} = require("./order.service");
const {
    placeManualOrder,
} = require("./manualOrder.service");

const createOrder = async (req, res) => {
    try {
        const { customerId, branchId, items } = req.body;

const result = await placeOrder(
    customerId,
    branchId,
    items
);

        return res.status(201).json(result);

    } catch (err) {

    if (err.message === "OUT_OF_STOCK") {
        return res.status(409).json({
            success: false,
            substitutionRequired: true,
            message: "Medicine is out of stock at the selected branch.",
            suggestion: err.alternativeBranch,
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
        const { customerId } = req.body;

        const result = await cancelOrder(id, customerId);

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
    fetchCustomerOrders,
    fetchOrderById,
    createManualOrder,
};
