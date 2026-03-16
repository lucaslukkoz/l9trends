"use client";

import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { AccountProvider } from "@/context/AccountContext";
import { useReminders } from "@/hooks/useReminders";
import { Reminder } from "@/types/reminder";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { fetchUnread, markAsRead, markAllAsRead } = useReminders();
  const [notifications, setNotifications] = useState<Reminder[]>([]);
  const [notifCount, setNotifCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchUnread();
      setNotifications(data.reminders);
      setNotifCount(data.count);
    } catch { /* silent */ }
  }, [fetchUnread]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkRead = async (id: number) => {
    await markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    loadNotifications();
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar
        notificationCount={notifCount}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AccountProvider>
        <DashboardContent>{children}</DashboardContent>
      </AccountProvider>
    </ProtectedRoute>
  );
}
