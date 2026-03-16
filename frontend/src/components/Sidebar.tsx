"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccountContext } from "@/context/AccountContext";
import { useAccounts } from "@/hooks/useAccounts";
import AccountSelector from "@/components/AccountSelector";

interface SidebarProps {
  onCompose?: () => void;
}

export default function Sidebar({ onCompose }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { accounts, activeAccountId, setActiveAccountId, refreshAccounts } = useAccountContext();
  const { removeAccount } = useAccounts();

  const handleRemoveAccount = async (accountId: number) => {
    try {
      await removeAccount(accountId);
      await refreshAccounts();
    } catch {
      alert("Falha ao desconectar conta.");
    }
  };

  const handleComposeClick = () => {
    if (onCompose) {
      onCompose();
    } else {
      window.dispatchEvent(new CustomEvent('openCompose'));
    }
  };

  const links = [
    {
      href: "/dashboard",
      label: "Caixa de Entrada",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
    },
    {
      id: "compose",
      label: "Escrever",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      href: "/dashboard/trash",
      label: "Lixeira",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
    {
      href: "/dashboard/agenda",
      label: "Agenda",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/settings",
      label: "Configurações",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
    {!isOpen && (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-xl bg-white border border-gray-200 shadow-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
        aria-label="Abrir menu lateral"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    )}
    <aside
      className={`${
        isOpen ? "w-64 opacity-100" : "w-0 overflow-hidden opacity-0"
      } transition-all duration-300 ease-in-out bg-white border-r border-gray-200 shadow-sm min-h-0 flex flex-col`}
    >
      <div className="p-4 flex flex-col gap-1 flex-1 min-w-[16rem]">
        {/* Toggle button */}
        <button
          onClick={() => setIsOpen(false)}
          className="self-end p-1.5 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 mb-2"
          aria-label="Fechar menu lateral"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* Navigation links */}
        {links.map((link) => {
          // "Escrever" is a button, not a link
          if (link.id === "compose") {
            return (
              <button
                key="compose"
                onClick={handleComposeClick}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent w-full text-left"
              >
                {link.icon}
                {link.label}
              </button>
            );
          }

          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href!}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#532E8E]/10 text-[#532E8E] border border-[#532E8E]/30"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}

        {/* Account section */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <AccountSelector
            accounts={accounts}
            activeAccountId={activeAccountId}
            onSelectAccount={setActiveAccountId}
            onAddAccount={() => router.push("/dashboard/add-account")}
            onRemoveAccount={handleRemoveAccount}
          />
        </div>
      </div>
    </aside>
    </>
  );
}
