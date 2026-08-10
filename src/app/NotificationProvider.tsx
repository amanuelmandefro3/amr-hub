"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Notification,
  NotificationListResponse,
} from "./data/notifications";
import { apiRequest } from "./IssueProvider";

const POLL_INTERVAL_MS = 30_000;

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const applyResponse = useCallback((response: NotificationListResponse) => {
    setNotifications(response.notifications);
    setUnreadCount(response.unreadCount);
  }, []);

  const refresh = useCallback(async () => {
    try {
      applyResponse(
        await apiRequest<NotificationListResponse>("/api/notifications"),
      );
    } catch {
      // Polling failures are silent — the bell just shows stale data until the
      // next successful refresh instead of interrupting the workspace.
    } finally {
      setIsLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<NotificationListResponse>("/api/notifications", {
      signal: controller.signal,
    })
      .then(applyResponse)
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    const poll = () => {
      if (document.hidden) return;
      void refresh();
    };

    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", poll);

    return () => {
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [refresh, applyResponse]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));

    try {
      await apiRequest(`/api/notifications/${encodeURIComponent(id)}`, {
        method: "PATCH",
      });
    } catch {
      // The next poll reconciles state if this request failed.
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );
    setUnreadCount(0);

    try {
      await apiRequest("/api/notifications/read-all", { method: "POST" });
    } catch {
      // The next poll reconciles state if this request failed.
    }
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      refresh,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, unreadCount, isLoading, refresh, markAsRead, markAllAsRead],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }

  return context;
}
