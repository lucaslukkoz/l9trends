"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccountContext } from "@/context/AccountContext";
import { useEmails } from "@/hooks/useEmails";
import { EmailSummary } from "@/types/email";

export default function SentPage() {
  const { activeAccountId } = useAccountContext();
  const { fetchSent } = useEmails();
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadSent = useCallback(async () => {
    if (!activeAccountId) return;
    setLoading(true);
    try {
      const data = await fetchSent(activeAccountId);
      setEmails(data.emails);
      setNextPageToken(data.nextPageToken);
    } catch {
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [activeAccountId, fetchSent]);

  useEffect(() => {
    if (activeAccountId) {
      loadSent();
    } else {
      setLoading(false);
    }
  }, [activeAccountId, loadSent]);

  const handleLoadMore = async () => {
    if (!nextPageToken || !activeAccountId) return;
    setLoadingMore(true);
    try {
      const data = await fetchSent(activeAccountId, nextPageToken);
      setEmails((prev) => [...prev, ...data.emails]);
      setNextPageToken(data.nextPageToken);
    } finally {
      setLoadingMore(false);
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
          <h2 className="text-lg font-bold text-gray-900">Enviados</h2>
          <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-600">
            {emails.length} {emails.length === 1 ? "e-mail" : "e-mails"}
          </span>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {emails.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-sm text-[#A5A8AD]">Nenhum e-mail enviado</p>
          </div>
        ) : (
          emails.map((email) => (
            <div
              key={email.id}
              className="glass rounded-xl p-4 flex items-start justify-between gap-4 glass-hover"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  Para: {email.to || email.from}
                </p>
                <p className="text-sm text-gray-700 truncate">{email.subject}</p>
                <p className="text-xs text-[#A5A8AD] mt-1 truncate">{email.snippet}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-[#A5A8AD]">
                    {formatDate(email.date)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {nextPageToken && (
        <div className="p-3">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#532E8E] hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 border border-gray-200"
          >
            {loadingMore ? "Carregando..." : "Carregar Mais"}
          </button>
        </div>
      )}
    </div>
  );
}
