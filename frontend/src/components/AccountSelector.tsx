"use client";

import { useState } from "react";
import { EmailAccount } from "@/types/account";

interface AccountSelectorProps {
  accounts: EmailAccount[];
  activeAccountId: number | null;
  onSelectAccount: (id: number) => void;
  onAddAccount: () => void;
  onRemoveAccount: (id: number) => void;
}

function ProviderIcon({ provider }: { provider: "gmail" | "imap" }) {
  if (provider === "gmail") {
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-xs font-bold text-red-600 shrink-0">
        G
      </span>
    );
  }
  return (
    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#532E8E]/10 shrink-0">
      <svg className="w-4 h-4 text-[#532E8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    </span>
  );
}

function SyncDot({ status }: { status: "idle" | "syncing" | "error" }) {
  if (status === "syncing") {
    return <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" title="Sincronizando" />;
  }
  if (status === "error") {
    return <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Erro na sincronização" />;
  }
  return <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Sincronizado" />;
}

function formatLastSync(dateStr?: string): string {
  if (!dateStr) return "Nunca";
  const date = new Date(dateStr);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AccountSelector({
  accounts,
  activeAccountId,
  onSelectAccount,
  onAddAccount,
  onRemoveAccount,
}: AccountSelectorProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-2 space-y-1">
      <p className="px-2 py-1 text-xs font-semibold text-[#A5A8AD] uppercase tracking-wider">
        Contas
      </p>

      {accounts.length === 0 && (
        <p className="px-2 py-2 text-xs text-[#A5A8AD]">Nenhuma conta conectada</p>
      )}

      {accounts.map((account) => {
        const isActive = account.id === activeAccountId;
        const isExpanded = expandedId === account.id;

        return (
          <div key={account.id}>
            {/* Collapsed row */}
            <button
              onClick={() => {
                onSelectAccount(account.id);
                setExpandedId(isExpanded ? null : account.id);
              }}
              className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all duration-200 ${
                isActive
                  ? "bg-[#532E8E]/10 border border-[#532E8E]/30"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <ProviderIcon provider={account.provider} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isActive ? "text-[#532E8E]" : "text-gray-700"}`}>
                  {account.email}
                </p>
              </div>
              <SyncDot status={account.syncStatus} />
              <svg
                className={`w-3.5 h-3.5 text-[#A5A8AD] transition-transform duration-200 shrink-0 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="mx-2 mt-1 mb-1 p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[#A5A8AD]">E-mail</span>
                    <span className="text-xs text-gray-700 truncate ml-2">{account.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[#A5A8AD]">Provedor</span>
                    <span className="text-xs text-gray-700">{account.provider === "gmail" ? "Gmail" : "IMAP"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[#A5A8AD]">Status</span>
                    <div className="flex items-center gap-1.5">
                      <SyncDot status={account.syncStatus} />
                      <span className="text-xs text-gray-700">
                        {account.syncStatus === "syncing"
                          ? "Sincronizando"
                          : account.syncStatus === "error"
                          ? "Erro"
                          : "Sincronizado"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[#A5A8AD]">\u00DAltima sinc.</span>
                    <span className="text-xs text-gray-700">
                      {formatLastSync((account as any).lastSyncAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Desconectar ${account.email}? Isso removerá a integração de e-mail, mas manterá sua conta na plataforma.`)) {
                      onRemoveAccount(account.id);
                    }
                  }}
                  className="w-full mt-1 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-all duration-200"
                >
                  Remover
                </button>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={onAddAccount}
        className="w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-[#532E8E] hover:bg-[#532E8E]/10 transition-all duration-200 border border-dashed border-[#532E8E]/30"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Adicionar Conta
      </button>
    </div>
  );
}
