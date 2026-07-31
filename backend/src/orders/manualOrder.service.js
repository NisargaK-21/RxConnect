const { placeOrder } = require("./order.service");

const placeManualOrder = async (
  customerId,
  branchId,
  medicineId,
  quantity
) => {
  return await placeOrder(customerId, branchId, [
    {
      medicineId,
      quantity,
    },
  ]);
};

module.exports = {
  placeManualOrder,
};