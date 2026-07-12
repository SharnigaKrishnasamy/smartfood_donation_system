import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Notification } from "../types";
import { NotificationAPI } from "../services/endpoints";
import { getSocket, connectSocket } from "../services/socket";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { show } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    const resp = await NotificationAPI.list();
    setNotifications(resp.data.notifications);
    setUnreadCount(resp.data.unread_count);
  }, [user]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket() || connectSocket();

    const handler = (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      show(notif.message, "info");
    };

    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
    };
  }, [user, show]);

  const markRead = async (id: number) => {
    await NotificationAPI.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await NotificationAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
