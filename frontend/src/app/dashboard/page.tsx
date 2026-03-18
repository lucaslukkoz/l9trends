"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEmails } from "@/hooks/useEmails";
import { useAccounts } from "@/hooks/useAccounts";
import { useAccountContext } from "@/context/AccountContext";
import { EmailSummary, EmailDetail } from "@/types/email";
import EmailList from "@/components/EmailList";
import EmailPreview from "@/components/EmailPreview";
import ComposeModal from "@/components/ComposeModal";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { fetchInbox, fetchEmail, deleteEmail, markAsRead, toggleFavorite } = useEmails();
  const { triggerSync } = useAccounts();
  const { accounts, activeAccountId } = useAccountContext();
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [composeMode, setComposeMode] = useState<'new' | 'reply' | 'forward' | null>(null);
  const [composeEmail, setComposeEmail] = useState<EmailDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inboxWidth, setInboxWidth] = useState(420);
  const isResizing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return;
      const containerLeft = containerRef.current.getBoundingClientRect().left;
      const newWidth = ev.clientX - containerLeft - 16; // 16 = p-4 padding
      setInboxWidth(Math.max(280, Math.min(newWidth, 700)));
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  // Filter emails by search query
  const filteredEmails = searchQuery
    ? emails.filter(
        (e) =>
          e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.snippet.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : emails;

  const loadInbox = useCallback(async () => {
    if (!activeAccountId) return;
    setLoading(true);
    setSelectedEmailId(null);
    setSelectedEmail(null);
    try {
      const data = await fetchInbox(activeAccountId);
      setEmails(data.emails);
      setNextPageToken(data.nextPageToken);
    } catch {
      setEmails([]);
      setNextPageToken(null);
    } finally {
      setLoading(false);
    }
  }, [activeAccountId, fetchInbox]);

  useEffect(() => {
    setSearchQuery("");
    if (activeAccountId) {
      loadInbox();
    } else {
      setLoading(false);
    }
  }, [activeAccountId, loadInbox]);

  // Auto-refresh inbox every 60 seconds
  useEffect(() => {
    if (!activeAccountId) return;
    const interval = setInterval(async () => {
      try {
        const data = await fetchInbox(activeAccountId);
        setEmails(data.emails);
        setNextPageToken(data.nextPageToken);
      } catch { /* silent refresh */ }
    }, 60000);
    return () => clearInterval(interval);
  }, [activeAccountId, fetchInbox]);

  // Listen for search event from Navbar
  useEffect(() => {
    const handleNavbarSearch = (e: Event) => {
      const query = (e as CustomEvent<string>).detail;
      setSearchQuery(query);
    };
    window.addEventListener('navbarSearch', handleNavbarSearch);
    return () => window.removeEventListener('navbarSearch', handleNavbarSearch);
  }, []);

  const handleLoadMore = async () => {
    if (!nextPageToken || !activeAccountId) return;
    setLoadingMore(true);
    try {
      const data = await fetchInbox(activeAccountId, nextPageToken);
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
      // Mark as read
      if (!email.isRead) {
        markAsRead(activeAccountId, email.id).catch(() => {});
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
      }
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
      // Mark as read
      markAsRead(activeAccountId, emailId).catch(() => {});
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isRead: true } : e));
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
    setComposeMode('reply');
  };

  const handleForward = (email: EmailDetail) => {
    setComposeEmail(email);
    setComposeMode('forward');
  };

  const handleComposeSent = () => {
    setComposeMode(null);
    setComposeEmail(null);
    loadInbox();
  };

  const handleToggleFavorite = async (emailId: string) => {
    if (!activeAccountId) return;
    // Optimistic update
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isFavorite: !e.isFavorite } : e));
    if (selectedEmail && selectedEmail.id === emailId) {
      setSelectedEmail(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : prev);
    }
    try {
      await toggleFavorite(activeAccountId, emailId);
    } catch {
      // Revert on error
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isFavorite: !e.isFavorite } : e));
      if (selectedEmail && selectedEmail.id === emailId) {
        setSelectedEmail(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : prev);
      }
    }
  };

  const handleSync = async () => {
    if (!activeAccountId) return;
    setSyncing(true);
    try {
      await triggerSync(activeAccountId);
      // Wait for the worker to process the sync job
      await new Promise(resolve => setTimeout(resolve, 3000));
      await loadInbox();
    } catch {
      alert("Falha na sincronização.");
    } finally {
      setSyncing(false);
    }
  };

  // No accounts connected
  if (!loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="glass rounded-2xl p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Conectar uma Conta de E-mail
          </h2>
          <p className="text-sm text-[#A5A8AD] mb-4">
            Conecte sua conta Gmail ou adicione uma conta IMAP para gerenciar seus e-mails.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push("/login")}
              className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-2.5 text-sm font-medium text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md"
            >
              Conectar Gmail
            </button>
            <button
              onClick={() => router.push("/dashboard/add-account")}
              className="rounded-xl bg-gradient-to-r from-[#532E8E] to-[#7B5EA7] px-5 py-2.5 text-sm font-medium text-white hover:from-[#3D2268] hover:to-[#532E8E] transition-all duration-200 shadow-md"
            >
              Adicionar Conta IMAP
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      {/* Email List Panel */}
      <div style={{ width: inboxWidth }} className="shrink-0 glass rounded-2xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Caixa de Entrada</h2>
          <div className="flex items-center gap-2">
            {activeAccount?.syncStatus === 'syncing' && (
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                Sincronizando...
              </span>
            )}
            {activeAccount?.syncStatus === 'error' && (
              <span className="text-xs text-red-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Erro de sincronização
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="rounded-lg bg-white border px-2.5 py-1 text-xs font-medium text-[#532E8E] hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 border-gray-200"
              title="Atualizar caixa de entrada"
            >
              {syncing ? "Atualizando..." : "\u27F3 Atualizar"}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <EmailList
            emails={filteredEmails}
            selectedEmailId={selectedEmailId}
            onSelectEmail={handleSelectEmail}
            onOpenEmail={handleOpenEmail}
            onDeleteEmail={handleDeleteEmail}
            onToggleFavorite={handleToggleFavorite}
          />
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
