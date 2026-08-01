import { api } from "@/lib/api";

export async function placeOrder(branchId, items) {
  const res = await api.post("/orders", { branchId, items });
  return res;
}

export async function placeManualOrder(payload) {
  const res = await api.post("/orders/manual", payload);
  return res.data;
}

export async function getCustomerOrders(customerId) {
  const res = await api.get(`/orders/customer/${customerId}`);
  return res.data;
}

export async function getOrderById(id) {
  const res = await api.get(`/orders/${id}`);
  return res.data;
}

export async function cancelOrder(orderId, customerId) {
  const res = await api.patch(`/orders/${orderId}/cancel`, { customerId });
  return res.data;
}

export async function updateOrderStatus(orderId, status) {
  const res = await api.patch(`/orders/${orderId}/status`, { status });
  return res.data;
}

export async function acceptSubstitution(orderId, body) {
  const res = await api.patch(`/orders/${orderId}/accept-substitution`, body);
  return res.data;
}

export async function rejectSubstitution(orderId, orderItemId) {
  const res = await api.patch(`/orders/${orderId}/reject-substitution`, {
    orderItemId,
  });
  return res.data;
}
