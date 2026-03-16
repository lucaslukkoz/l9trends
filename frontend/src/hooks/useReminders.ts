"use client";

import { useCallback } from "react";
import api from "@/lib/api";
import { Reminder } from "@/types/reminder";

export function useReminders() {
  const fetchReminders = useCallback(async (): Promise<Reminder[]> => {
    const res = await api.get<{ reminders: Reminder[] }>("/reminders");
    return res.data.reminders;
  }, []);

  const fetchUnread = useCallback(async (): Promise<{ reminders: Reminder[]; count: number }> => {
    const res = await api.get<{ reminders: Reminder[]; count: number }>("/reminders/unread");
    return res.data;
  }, []);

  const createReminder = useCallback(async (title: string, description: string | null, dueDate: string): Promise<Reminder> => {
    const res = await api.post<Reminder>("/reminders", { title, description, dueDate });
    return res.data;
  }, []);

  const markAsRead = useCallback(async (id: number): Promise<void> => {
    await api.patch(`/reminders/${id}/read`);
  }, []);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    await api.patch("/reminders/read-all");
  }, []);

  const deleteReminder = useCallback(async (id: number): Promise<void> => {
    await api.delete(`/reminders/${id}`);
  }, []);

  return { fetchReminders, fetchUnread, createReminder, markAsRead, markAllAsRead, deleteReminder };
}
