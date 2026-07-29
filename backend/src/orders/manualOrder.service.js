const { placeOrder } = require("./order.service");

const placeManualOrder = async (
    customerId,
    branchId,
    medicineId,
    quantity
) => {
    // Manual-order-specific logic can be added here later.

    return await placeOrder(
        customerId,
        branchId,
        medicineId,
        quantity
    );
};

module.exports = {
    placeManualOrder,
};