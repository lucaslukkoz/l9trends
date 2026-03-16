"use client";

import { useState } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { useAccountContext } from "@/context/AccountContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { AccountProvider } from "@/context/AccountContext";

function SettingsContent() {
  const { accounts, refreshAccounts } = useAccountContext();
  const { removeAccount } = useAccounts();
  const [removing, setRemoving] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AccountProvider>
        <div className="flex flex-col h-screen overflow-hidden">
          <Navbar />
          <div className="flex flex-1 min-h-0">
            <Sidebar />
            <main className="flex-1 min-h-0 overflow-y-auto p-6">
              <SettingsContent />
            </main>
          </div>
        </div>
      </AccountProvider>
    </ProtectedRoute>
  );
}
