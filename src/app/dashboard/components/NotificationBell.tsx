"use client";

import { useEffect, useRef, useState } from "react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    try {
      setLoading(true);

      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(
          "Notification loading error:",
          result.error
        );
        return;
      }

      setNotifications(result.notifications ?? []);
      setUnreadCount(result.unreadCount ?? 0);
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function markAsRead(
    notification: Notification
  ) {
    if (notification.is_read) {
      return;
    }

    try {
      const response = await fetch(
        "/api/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationId: notification.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error(
          "Mark notification as read error:",
          result.error
        );
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );

      setUnreadCount((current) =>
        Math.max(0, current - 1)
      );
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);

    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  return (
    <div
      ref={dropdownRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);

          if (!isOpen) {
            loadNotifications();
          }
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg shadow-sm transition hover:bg-slate-50"
        aria-label="Notifications"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-semibold text-slate-900">
                Notifications
              </h3>

              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            <button
              type="button"
              onClick={loadNotifications}
              className="text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="text-3xl">
                  🔔
                </div>

                <p className="mt-3 font-medium text-slate-700">
                  No notifications yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  New activity will appear here.
                </p>
              </div>
            ) : (
              notifications.map(
                (notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      markAsRead(notification)
                    }
                    className={`w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                      notification.is_read
                        ? "bg-white"
                        : "bg-blue-50/50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 text-base">
                        {notification.is_read
                          ? "○"
                          : "●"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p
                            className={`text-sm ${
                              notification.is_read
                                ? "font-medium text-slate-700"
                                : "font-semibold text-slate-900"
                            }`}
                          >
                            {notification.title}
                          </p>
                        </div>

                        <p className="mt-1 text-sm leading-5 text-slate-600">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          {formatTime(
                            notification.created_at
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}