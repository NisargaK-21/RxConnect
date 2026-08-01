import { api } from "@/lib/api";

export async function getPendingPrescriptions() {
  const res = await api.get("/prescriptions/pending");
  return res.data;
}

export async function reviewPrescription(id, status) {
  const res = await api.patch(`/prescriptions/${id}/review`, { status });
  return res.data;
}

export async function uploadPrescription(orderItemId, file) {
  const form = new FormData();
  form.append("orderItemId", String(orderItemId));
  form.append("prescription", file);

  const res = await api.post("/prescriptions/upload", form);
  return res.data;
}
