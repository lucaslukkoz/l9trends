"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAccountContext } from "@/context/AccountContext";
import { useEmails } from "@/hooks/useEmails";
import { EmailSummary, EmailDetail } from "@/types/email";
import EmailPreview from "@/components/EmailPreview";
import ComposeModal from "@/components/ComposeModal";

export default function SentPage() {
  const { activeAccountId } = useAccountContext();
  const { fetchSent, fetchEmail, deleteEmail, toggleFavorite } = useEmails();
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [composeMode, setComposeMode] = useState<"reply" | "forward" | null>(null);
  const [composeEmail, setComposeEmail] = useState<EmailDetail | null>(null);
  const [panelWidth, setPanelWidth] = useState(420);
  const isResizing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return;
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const newWidth = ev.clientX - containerLeft - 16;
      setPanelWidth(Math.max(280, Math.min(newWidth, 700)));
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  const loadSent = useCallback(async () => {
    if (!activeAccountId) return;
    setLoading(true);
    setSelectedEmailId(null);
    setSelectedEmail(null);
    try {
      const data = await fetchSent(activeAccountId);
      setEmails(data.emails);
      setNextPageToken(data.nextPageToken);
    } catch {
      setEmails([]);
      setNextPageToken(null);
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

  const handleSelectEmail = async (email: EmailSummary) => {
    if (!activeAccountId) return;
    setSelectedEmailId(email.id);
    setPreviewLoading(true);
    try {
      const detail = await fetchEmail(activeAccountId, email.id);
      setSelectedEmail(detail);
    } catch {
      setSelectedEmail(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenEmail = async (emailId: string) => {
    if (!activeAccountId) return;
    setSelectedEmailId(emailId);
    setPreviewLoading(true);
    try {
      const detail = await fetchEmail(activeAccountId, emailId);
      setSelectedEmail(detail);
    } catch {
      setSelectedEmail(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    if (!activeAccountId) return;
    try {
      await deleteEmail(activeAccountId, emailId);
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
      if (selectedEmailId === emailId) {
        setSelectedEmailId(null);
        setSelectedEmail(null);
      }
    } catch {
      alert("Falha ao excluir e-mail.");
    }
  };

  const handleReply = (email: EmailDetail) => {
    setComposeEmail(email);
    setComposeMode("reply");
  };

  const handleForward = (email: EmailDetail) => {
    setComposeEmail(email);
    setComposeMode("forward");
  };

  const handleComposeSent = () => {
    setComposeMode(null);
    setComposeEmail(null);
    loadSent();
  };

  const handleToggleFavorite = async (emailId: string) => {
    if (!activeAccountId) return;
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, isFavorite: !e.isFavorite } : e))
    );
    if (selectedEmail && selectedEmail.id === emailId) {
      setSelectedEmail((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : prev));
    }
    try {
      await toggleFavorite(activeAccountId, emailId);
    } catch {
      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, isFavorite: !e.isFavorite } : e))
      );
      if (selectedEmail && selectedEmail.id === emailId) {
        setSelectedEmail((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : prev));
      }
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
    <div ref={containerRef} className="flex h-full p-4">
      {/* Sent Email List Panel */}
      <div style={{ width: panelWidth }} className="shrink-0 glass rounded-2xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#532E8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">Enviados</h2>
            <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-600">
              {emails.length}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {emails.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#A5A8AD]">Nenhum e-mail enviado</p>
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                onClick={() => handleSelectEmail(email)}
                className={`rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                  selectedEmailId === email.id
                    ? "bg-[#532E8E]/10 border border-[#532E8E]/20"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900 truncate">
                  Para: {email.to || email.from}
                </p>
                <p className="text-sm text-gray-700 truncate">{email.subject}</p>
                <p className="text-xs text-[#A5A8AD] mt-1 truncate">{email.snippet}</p>
                <span className="text-xs text-[#A5A8AD] mt-1 block">
                  {formatDate(email.date)}
                </span>
              </div>
            ))
          )}
        </div>
        {nextPageToken && (
          <div className="p-3 border-t border-gray-200">
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

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="w-2 shrink-0 cursor-col-resize flex items-center justify-center group"
        title="Arrastar para redimensionar"
      >
        <div className="w-0.5 h-8 rounded-full bg-gray-300 group-hover:bg-[#532E8E] group-active:bg-[#532E8E] transition-colors duration-200" />
      </div>

      {/* Preview Panel */}
      <EmailPreview
        email={selectedEmail}
        loading={previewLoading}
        onOpen={handleOpenEmail}
        onDelete={handleDeleteEmail}
        onReply={handleReply}
        onForward={handleForward}
        onToggleFavorite={handleToggleFavorite}
        accountId={activeAccountId || undefined}
      />

      {composeMode && activeAccountId && (
        <ComposeModal
          mode={composeMode}
          originalEmail={composeEmail}
          accountId={activeAccountId}
          onClose={() => { setComposeMode(null); setComposeEmail(null); }}
          onSent={handleComposeSent}
        />
      )}
    </div>
  );
}
