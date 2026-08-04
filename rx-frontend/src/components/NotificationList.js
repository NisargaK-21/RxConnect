"use client";

import { useEffect, useState } from "react";
import {
  getNotifications,
  markAsRead,
} from "../services/notification.service";

export default function NotificationList({ userId }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications(userId);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRead = async (id) => {
    await markAsRead(id);
    loadNotifications();
  };

  return (
    <div>
      <h2>Notifications</h2>

      {notifications.length === 0 ? (
        <p>No notifications available.</p>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <strong>{notification.type}</strong>

            <pre>
              {JSON.stringify(notification.payload, null, 2)}
            </pre>

            <p>
              Status:{" "}
              {notification.is_read ? "Read" : "Unread"}
            </p>

            {!notification.is_read && (
              <button
                onClick={() =>
                  handleRead(notification.id)
                }
              >
                Mark as Read
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}