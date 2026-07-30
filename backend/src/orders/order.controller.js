const {
    placeOrder,
    updateOrderStatus,
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
    createManualOrder,
};