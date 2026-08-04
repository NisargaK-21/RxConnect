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
