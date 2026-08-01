import { api } from "@/lib/api";

export async function getCatalog(search = "", page = 1, limit = 100) {
  const res = await api.get("/catalog", {
    params: { search, page, limit },
  });
  return res.data;
}

export async function getMedicineById(id, branchId) {
  const res = await api.get(`/catalog/${id}`, {
    params: { branchId },
  });
  return res.data;
}
