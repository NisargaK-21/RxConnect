const { placeOrder } = require("./order.service");

const createOrder = async (req, res) => {
    try {
        const { customerId, branchId, medicineId, quantity } = req.body;

        const result = await placeOrder(
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
};