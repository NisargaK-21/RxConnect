import { api } from "@/lib/api";

export async function getDashboard() {
  const res = await api.get("/dashboard");
  return res.data;
}

export async function getLowStockDashboard() {
  const res = await api.get("/dashboard/lowstock");
  return res.data;
}

export async function getFulfillmentDashboard() {
  const res = await api.get("/dashboard/fulfillment");
  return res.data;
}
