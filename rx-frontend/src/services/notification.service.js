import { api } from "@/lib/api";

export async function getNotifications(userId) {
  const res = await api.get(`/notifications/${userId}`);
  return res.data;
}

export async function markNotificationRead(id) {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
}
const API_URL = "http://localhost:5000/notifications";

export const getNotifications = async (userId) => {
  const response = await fetch(`${API_URL}/${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }

  return response.json();
};

export const markAsRead = async (id) => {
  const response = await fetch(`${API_URL}/${id}/read`, {
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Failed to mark notification");
  }

  return response.json();
};
