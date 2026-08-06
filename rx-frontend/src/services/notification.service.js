import { api } from "@/lib/api";

export async function getNotifications(userId) {
  const res = await api.get(`/notifications/${userId}`);
  return res.data;
}

export async function markNotificationRead(id) {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
}
