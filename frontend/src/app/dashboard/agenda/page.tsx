"use client";

import { useEffect, useState } from "react";
import { useReminders } from "@/hooks/useReminders";
import { Reminder } from "@/types/reminder";

export default function AgendaPage() {
  const { fetchReminders, createReminder, markAsRead, deleteReminder } = useReminders();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const loadReminders = async () => {
    setLoading(true);
    try {
      const data = await fetchReminders();
      setReminders(data);
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    setSubmitting(true);
    try {
      const newReminder = await createReminder(
        title.trim(),
        description.trim() || null,
        new Date(dueDate).toISOString()
      );
      setReminders((prev) => [newReminder, ...prev]);
      setTitle("");
      setDescription("");
      setDueDate("");
    } catch {
      alert("Falha ao criar lembrete.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isRead: true } : r))
      );
    } catch {
      alert("Falha ao marcar como lido.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Falha ao excluir lembrete.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (reminder: Reminder) => {
    if (reminder.isRead) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-medium text-green-700">
          Lido
        </span>
      );
    }
    const isPast = new Date(reminder.dueDate) < new Date();
    if (isPast) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-medium text-red-700">
          Vencido
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-50 border border-yellow-200 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
        Pendente
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass rounded-2xl p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#532E8E] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      {/* Header */}
      <div className="glass rounded-2xl px-6 py-4">
        <h2 className="text-lg font-bold text-gray-900">Agenda</h2>
      </div>

      {/* Create Reminder Form */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Novo Lembrete</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="T&iacute;tulo *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#532E8E] focus:border-transparent"
            />
          </div>
          <div>
            <textarea
              placeholder="Descri&ccedil;&atilde;o (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#532E8E] focus:border-transparent resize-none"
            />
          </div>
          <div>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#532E8E] focus:border-transparent"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !title.trim() || !dueDate}
              className="rounded-xl bg-gradient-to-r from-[#532E8E] to-[#7B5EA7] px-5 py-2.5 text-sm font-medium text-white hover:from-[#3D2268] hover:to-[#532E8E] disabled:opacity-50 transition-all duration-200 shadow-md"
            >
              {submitting ? "Adicionando..." : "Adicionar Lembrete"}
            </button>
          </div>
        </form>
      </div>

      {/* Reminders List */}
      <div className="space-y-2">
        {reminders.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-sm text-[#A5A8AD]">Nenhum lembrete agendado</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {reminder.title}
                  </p>
                  {getStatusBadge(reminder)}
                </div>
                {reminder.description && (
                  <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                )}
                <p className="text-xs text-[#A5A8AD] mt-2">
                  Vencimento: {formatDate(reminder.dueDate)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!reminder.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(reminder.id)}
                    className="rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#532E8E] hover:bg-gray-50 transition-all duration-200"
                  >
                    Marcar como lido
                  </button>
                )}
                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="rounded-lg bg-white border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
