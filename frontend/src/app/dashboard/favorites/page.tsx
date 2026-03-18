"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccountContext } from "@/context/AccountContext";
import { useEmails } from "@/hooks/useEmails";
import { EmailSummary } from "@/types/email";

export default function FavoritesPage() {
  const { activeAccountId } = useAccountContext();
  const { fetchFavorites, toggleFavorite } = useEmails();
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!activeAccountId) return;
    setLoading(true);
    try {
      const data = await fetchFavorites(activeAccountId);
      setEmails(data.emails);
      setNextPageToken(data.nextPageToken);
    } catch {
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [activeAccountId, fetchFavorites]);

  useEffect(() => {
    if (activeAccountId) {
      loadFavorites();
    } else {
      setLoading(false);
    }
  }, [activeAccountId, loadFavorites]);

  const handleLoadMore = async () => {
    if (!nextPageToken || !activeAccountId) return;
    setLoadingMore(true);
    try {
      const data = await fetchFavorites(activeAccountId, nextPageToken);
      setEmails((prev) => [...prev, ...data.emails]);
      setNextPageToken(data.nextPageToken);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggleFavorite = async (emailId: string) => {
    if (!activeAccountId) return;
    try {
      await toggleFavorite(activeAccountId, emailId);
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
    } catch {
      alert("Falha ao remover dos favoritos.");
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
          <svg className="w-5 h-5 text-yellow-400 fill-yellow-400" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h2 className="text-lg font-bold text-gray-900">Favoritos</h2>
          <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-600">
            {emails.length} {emails.length === 1 ? "e-mail" : "e-mails"}
          </span>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {emails.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-sm text-[#A5A8AD]">Nenhum e-mail favorito</p>
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
                    {formatDate(email.date)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleToggleFavorite(email.id)}
                className="shrink-0 self-center p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-50 transition-all duration-200"
                title="Remover dos favoritos"
              >
                <svg className="w-5 h-5 fill-yellow-400" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
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
