import { api } from "@/lib/api";

export async function getBranchStock(branchId) {
  const res = await api.get("/stock", { params: { branchId } });
  return res.data;
}

export async function updateLowStockThreshold(body) {
  const res = await api.patch("/stock/threshold", body);
  return res.data;
}

export async function acknowledgeAlert(alertId) {
  const res = await api.patch(`/stock/alerts/${alertId}/acknowledge`);
  return res.data;
}
