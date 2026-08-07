import { api } from "@/lib/api";

export async function getAvailableJobs() {
  const res = await api.get("/delivery/jobs");
  return res.data;
}

export async function getMyDeliveryJobs() {
  const res = await api.get("/delivery/my-jobs");
  return res.data;
}

export async function claimJob(orderId) {
  const res = await api.post(`/delivery/jobs/${orderId}/claim`);
  return res.data;
}

export async function confirmPickup(orderId) {
  const res = await api.patch(`/delivery/jobs/${orderId}/pickup`);
  return res.data;
}

export async function confirmDelivery(orderId) {
  const res = await api.patch(`/delivery/jobs/${orderId}/deliver`);
  return res.data;
}
