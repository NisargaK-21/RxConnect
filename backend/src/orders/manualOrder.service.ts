const { placeOrder } = require("./order.service");

const placeManualOrder = async (
  customerId: number | string,
  branchId: number | string,
  medicineId: number | string,
  quantity: number
) => {
  return await placeOrder(
    customerId,
    branchId,
    [
      {
        medicineId,
        quantity,
      },
    ]
  );
};

module.exports = {
  placeManualOrder,
};