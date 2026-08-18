"use client";

import { useEffect, useState, useRef } from "react";
import {
  getNotifications,
  markNotificationRead,
} from "@/services/notification.service";
import { getUser } from "@/utils/auth";

export default function NotificationBell() {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Wait until component mounts before reading localStorage
  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  const fetchNotes = async () => {
    if (!user?.id) return;

    try {
      const data = await getNotifications(user.id);

      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data?.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotes();

    const interval = setInterval(fetchNotes, 15000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return null;
  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, is_read: true }
            : n
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-xs"
        aria-label="Notifications"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1.5 text-[10px] text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-sm">
                Notifications
              </h3>

              {unreadCount > 0 && (
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200">
                  {unreadCount} new
                </span>
              )}
            </div>

            <button
              onClick={fetchNotes}
              className="text-xs font-medium text-teal-600 hover:text-teal-800 transition"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => {
                let payload = {};

                try {
                  payload =
                    typeof n.payload === "string"
                      ? JSON.parse(n.payload)
                      : n.payload || {};
                } catch {
                  payload = {};
                }

                return (
                  <div
                    key={n.id}
                    className={`py-3 flex flex-col gap-1 ${
                      !n.is_read
                        ? "bg-slate-50/80 -mx-2 px-3 rounded-xl"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-teal-700 uppercase tracking-wide text-[10px]">
                        {n.type?.replace(/_/g, " ")}
                      </span>

                      <span className="text-[10px] text-slate-400">
                        {new Date(n.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700">
                      {payload.message ||
                        payload.medicine ||
                        JSON.stringify(payload)}
                    </p>

                    {!n.is_read && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="self-end text-[10px] font-semibold text-teal-600 hover:underline mt-1"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}