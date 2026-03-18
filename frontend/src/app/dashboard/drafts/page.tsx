"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccountContext } from "@/context/AccountContext";
import { useDrafts } from "@/hooks/useDrafts";
import { Draft } from "@/types/email";
import ComposeModal from "@/components/ComposeModal";

export default function DraftsPage() {
  const { activeAccountId } = useAccountContext();
  const { fetchDrafts, deleteDraft } = useDrafts();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);

  const loadDrafts = useCallback(async () => {
    if (!activeAccountId) return;
    setLoading(true);
    try {
      const data = await fetchDrafts(activeAccountId);
      setDrafts(data.drafts);
      setNextPageToken(data.nextPageToken);
    } catch {
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, [activeAccountId, fetchDrafts]);

  useEffect(() => {
    if (activeAccountId) {
      loadDrafts();
    } else {
      setLoading(false);
    }
  }, [activeAccountId, loadDrafts]);

  const handleLoadMore = async () => {
    if (!nextPageToken || !activeAccountId) return;
    setLoadingMore(true);
    try {
      const data = await fetchDrafts(activeAccountId, nextPageToken);
      setDrafts((prev) => [...prev, ...data.drafts]);
      setNextPageToken(data.nextPageToken);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDelete = async (draftId: number) => {
    if (!activeAccountId) return;
    try {
      await deleteDraft(activeAccountId, draftId);
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    } catch {
      // silent
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
          <svg className="w-5 h-5 text-[#532E8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-lg font-bold text-gray-900">Rascunhos</h2>
          <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-600">
            {drafts.length} {drafts.length === 1 ? "rascunho" : "rascunhos"}
          </span>
        </div>
      </div>

      {/* Draft List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {drafts.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-[#A5A8AD]">Nenhum rascunho salvo</p>
          </div>
        ) : (
          drafts.map((draft) => (
            <div
              key={draft.id}
              onClick={() => setEditingDraft(draft)}
              className="glass rounded-xl p-4 flex items-start justify-between gap-4 glass-hover cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {draft.to ? `Para: ${draft.to}` : "Sem destinatario"}
                </p>
                <p className="text-sm text-gray-700 truncate">
                  {draft.subject || "(Sem assunto)"}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-[#A5A8AD]">
                    {formatDate(draft.updatedAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(draft.id);
                }}
                className="shrink-0 self-center p-1.5 rounded-lg text-[#A5A8AD] hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                title="Excluir rascunho"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {/* Compose modal for editing draft */}
      {editingDraft && activeAccountId && (
        <ComposeModal
          mode="new"
          accountId={activeAccountId}
          initialDraft={editingDraft}
          onClose={() => setEditingDraft(null)}
          onSent={() => {
            setEditingDraft(null);
            loadDrafts();
          }}
        />
      )}
    </div>
  );
}
