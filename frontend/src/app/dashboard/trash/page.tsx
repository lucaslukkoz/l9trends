"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccountContext } from "@/context/AccountContext";
import api from "@/lib/api";
import { EmailSummary } from "@/types/email";

export default function TrashPage() {
  const { activeAccountId } = useAccountContext();
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchTrash = useCallback(async () => {
    if (!activeAccountId) return;
    setLoading(true);
    try {
      const res = await api.get(`/accounts/${activeAccountId}/trash`);
      setEmails(res.data.emails);
    } catch {
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [activeAccountId]);

  useEffect(() => {
    if (activeAccountId) {
      fetchTrash();
    } else {
      setLoading(false);
    }
  }, [activeAccountId, fetchTrash]);

  const handleRestore = async (emailId: string) => {
    if (!activeAccountId) return;
    setRestoringId(emailId);
    try {
      await api.post(`/accounts/${activeAccountId}/emails/${emailId}/restore`);
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
    } catch {
      alert("Falha ao restaurar e-mail.");
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (emailId: string) => {
    if (!activeAccountId) return;
    setDeletingId(emailId);
    try {
      await api.delete(`/accounts/${activeAccountId}/trash/${emailId}`);
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
      setConfirmDeleteId(null);
    } catch {
      alert("Falha ao excluir e-mail permanentemente.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="glass rounded-2xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">Lixeira</h2>
          <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-600">
            {emails.length} {emails.length === 1 ? "e-mail" : "e-mails"}
          </span>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {emails.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-sm text-[#A5A8AD]">A lixeira est&aacute; vazia</p>
          </div>
        ) : (
          emails.map((email) => (
            <div
              key={email.id}
              className="glass rounded-xl p-4 flex items-start justify-between gap-4 glass-hover"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {email.from}
                </p>
                <p className="text-sm text-gray-700 truncate">{email.subject}</p>
                <p className="text-xs text-[#A5A8AD] mt-1 truncate">{email.snippet}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-[#A5A8AD]">
                    Recebido: {formatDate(email.date)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRestore(email.id)}
                  disabled={restoringId === email.id}
                  className="rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-[#532E8E] hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                >
                  {restoringId === email.id ? "Restaurando..." : "Restaurar"}
                </button>

                {confirmDeleteId === email.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePermanentDelete(email.id)}
                      disabled={deletingId === email.id}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-all duration-200"
                    >
                      {deletingId === email.id ? "Excluindo..." : "Confirmar"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-all duration-200"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(email.id)}
                    className="rounded-lg bg-white border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
                  >
                    Excluir Permanentemente
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
