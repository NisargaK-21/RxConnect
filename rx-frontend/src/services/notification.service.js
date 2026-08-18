import { api } from "@/lib/api";

export const getNotifications = async (userId) => {
  const response = await api.get(`/notifications/${userId}`);
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markNotificationRead = markAsRead;
