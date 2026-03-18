"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { useAccountContext } from "@/context/AccountContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import ComposeModal from "@/components/ComposeModal";
import { AccountProvider } from "@/context/AccountContext";

function SettingsContent() {
  const { accounts, refreshAccounts, activeAccountId } = useAccountContext();
  const { removeAccount, getSignature, updateSignature } = useAccounts();
  const [removing, setRemoving] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sigAccountId, setSigAccountId] = useState<number | null>(null);
  const [sigHtml, setSigHtml] = useState("");
  const [sigEnabled, setSigEnabled] = useState(false);
  const [sigLoading, setSigLoading] = useState(false);
  const [sigSaving, setSigSaving] = useState(false);
  const sigEditorRef = useRef<HTMLDivElement>(null);

  const loadSignature = useCallback(async (accountId: number) => {
    setSigLoading(true);
    try {
      const data = await getSignature(accountId);
      const html = data.signatureHtml || "";
      setSigHtml(html);
      // Set contentEditable content after state update
      setTimeout(() => {
        if (sigEditorRef.current) {
          sigEditorRef.current.innerHTML = html;
        }
      }, 0);
      setSigEnabled(data.signatureEnabled);
    } catch {
      setSigHtml("");
      setSigEnabled(false);
    } finally {
      setSigLoading(false);
    }
  }, [getSignature]);

  useEffect(() => {
    if (sigAccountId) {
      loadSignature(sigAccountId);
    } else if (accounts.length > 0) {
      const defaultId = activeAccountId || accounts[0].id;
      setSigAccountId(defaultId);
      loadSignature(defaultId);
    }
  }, [accounts, activeAccountId, sigAccountId, loadSignature]);

  const handleSaveSignature = async () => {
    if (!sigAccountId) return;
    setSigSaving(true);
    setMessage(null);
    try {
      // Read HTML directly from the contentEditable editor
      const htmlSignature = sigEditorRef.current?.innerHTML || sigHtml;
      await updateSignature(sigAccountId, htmlSignature, sigEnabled);
      setMessage({ type: "success", text: "Assinatura salva com sucesso." });
    } catch {
      setMessage({ type: "error", text: "Falha ao salvar assinatura." });
    } finally {
      setSigSaving(false);
    }
  };

  const handleRemove = async (accountId: number) => {
    if (!confirm("Tem certeza que deseja remover esta conta? Esta ação não pode ser desfeita.")) {
      return;
    }
    setRemoving(accountId);
    setMessage(null);
    try {
      await removeAccount(accountId);
      await refreshAccounts();
      setMessage({ type: "success", text: "Conta removida com sucesso." });
    } catch {
      setMessage({ type: "error", text: "Falha ao remover conta." });
    } finally {
      setRemoving(null);
    }
  };

  const getSyncDot = (status: string) => {
    switch (status) {
      case "idle":
        return "bg-green-400";
      case "syncing":
        return "bg-yellow-400 animate-pulse";
      case "error":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      {message && (
        <div
          className={`rounded-xl p-3 text-sm border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-600"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Contas de E-mail Conectadas</h2>

        {accounts.length === 0 ? (
          <p className="text-sm text-[#A5A8AD]">Nenhuma conta conectada.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-4 rounded-xl bg-white border border-gray-200 p-4"
              >
                {/* Provider icon */}
                <div className="shrink-0">
                  {account.provider === "gmail" ? (
                    <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-red-600">G</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#532E8E]/10 border border-[#532E8E]/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#532E8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Account info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{account.email}</p>
                  <p className="text-xs text-[#A5A8AD]">
                    {account.displayName || account.provider.toUpperCase()}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${getSyncDot(account.syncStatus)}`} />
                    <span className="text-xs text-[#A5A8AD] capitalize">{account.syncStatus}</span>
                    {account.lastSyncAt && (
                      <span className="text-xs text-[#A5A8AD]">
                        &middot; {new Date(account.lastSyncAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(account.id)}
                  disabled={removing === account.id}
                  className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {removing === account.id ? "Removendo..." : "Remover"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Signature Section */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Assinatura de E-mail</h2>

        {accounts.length === 0 ? (
          <p className="text-sm text-[#A5A8AD]">Conecte uma conta para configurar a assinatura.</p>
        ) : (
          <div className="space-y-4">
            {/* Account selector */}
            {accounts.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-[#A5A8AD] mb-1">Conta</label>
                <select
                  value={sigAccountId || ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSigAccountId(id);
                    loadSignature(id);
                  }}
                  className="w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#532E8E] focus:border-transparent"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.email}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Enable toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSigEnabled(!sigEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  sigEnabled ? "bg-[#532E8E]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    sigEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {sigEnabled ? "Assinatura ativada" : "Assinatura desativada"}
              </span>
            </div>

            {sigLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#532E8E] border-t-transparent" />
              </div>
            ) : (
              <>
                {/* Signature editor - rich text */}
                <div>
                  <label className="block text-sm font-medium text-[#A5A8AD] mb-1">Conteudo da assinatura</label>
                  <p className="text-xs text-[#A5A8AD] mb-2">Cole texto formatado, imagens ou logotipos diretamente no editor abaixo.</p>
                  <div
                    ref={sigEditorRef}
                    contentEditable
                    onInput={() => {
                      if (sigEditorRef.current) {
                        setSigHtml(sigEditorRef.current.innerHTML);
                      }
                    }}
                    className="w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#532E8E] focus:border-transparent min-h-[120px] max-h-[300px] overflow-y-auto"
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  />
                </div>

                {/* Save button */}
                <button
                  onClick={handleSaveSignature}
                  disabled={sigSaving}
                  className="rounded-xl bg-gradient-to-r from-[#532E8E] to-[#7B5EA7] px-5 py-2.5 text-sm font-medium text-white hover:from-[#3D2268] hover:to-[#532E8E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
                >
                  {sigSaving ? "Salvando..." : "Salvar Assinatura"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsLayout() {
  const { activeAccountId } = useAccountContext();
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    const handleOpenCompose = () => setComposeOpen(true);
    window.addEventListener('openCompose', handleOpenCompose);
    return () => window.removeEventListener('openCompose', handleOpenCompose);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          <SettingsContent />
        </main>
      </div>
      {composeOpen && activeAccountId && (
        <ComposeModal
          mode="new"
          originalEmail={null}
          accountId={activeAccountId}
          onClose={() => setComposeOpen(false)}
          onSent={() => setComposeOpen(false)}
        />
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AccountProvider>
        <SettingsLayout />
      </AccountProvider>
    </ProtectedRoute>
  );
}
