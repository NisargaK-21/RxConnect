import orderService from "./order.service";
const placeManualOrder = async (
  customerId:number,
  branchId:number,
  medicineId:number,
  quantity:number
) => {
  return await orderService.placeOrder(customerId, branchId, [
    {
      medicineId,
      quantity,
    },
  ]);
};

export{
  placeManualOrder,
};