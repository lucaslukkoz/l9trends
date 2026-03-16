"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

interface Notification {
  id: number;
  title: string;
  dueDate: string;
  isRead: boolean;
}

interface NavbarProps {
  onToggleSidebar?: () => void;
  onSearch?: (query: string) => void;
  notificationCount?: number;
  notifications?: Notification[];
  onMarkRead?: (id: number) => void;
  onMarkAllRead?: () => void;
}

export default function Navbar({
  onToggleSidebar,
  onSearch,
  notificationCount = 0,
  notifications = [],
  onMarkRead,
  onMarkAllRead,
}: NavbarProps) {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await api.post<{ avatarUrl: string }>('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      window.location.reload();
    } catch {
      alert('Falha ao enviar foto.');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    } else {
      window.dispatchEvent(new CustomEvent('navbarSearch', { detail: e.target.value }));
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';

  return (
    <nav className="bg-[#532E8E] text-white px-6 py-3 flex items-center gap-4">
      {/* Left: logo */}
      <div className="shrink-0">
        <span className="text-xl font-bold tracking-tight">
          L9<span className="text-white/80">Inbox</span>
        </span>
      </div>

      {/* Center: search bar */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-xl">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Pesquisar e-mails..."
            className="w-full bg-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
          />
        </div>
      </div>

      {/* Right: bell + welcome + avatar + logout */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Notificações"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Notificações</span>
                {notifications.length > 0 && onMarkAllRead && (
                  <button
                    onClick={() => {
                      onMarkAllRead();
                      setShowNotifications(false);
                    }}
                    className="text-xs text-[#532E8E] hover:text-[#3D2268] font-medium transition-colors"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-[#A5A8AD]">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-gray-100 flex items-start gap-3 ${
                        !notif.isRead ? "bg-[#532E8E]/5" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!notif.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-[#A5A8AD] mt-0.5">
                          {new Date(notif.dueDate).toLocaleDateString("pt-BR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!notif.isRead && onMarkRead && (
                        <button
                          onClick={() => onMarkRead(notif.id)}
                          className="shrink-0 mt-0.5 p-1 rounded text-[#A5A8AD] hover:text-[#532E8E] transition-colors"
                          title="Marcar como lida"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
              <a
                href="/dashboard/agenda"
                className="block px-4 py-2.5 text-center text-xs font-medium text-[#532E8E] hover:bg-gray-50 border-t border-gray-200 transition-colors"
              >
                Ver Agenda
              </a>
            </div>
          )}
        </div>

        {user && (
          <>
            <span className="text-sm text-white/80">
              Bem-vindo, {user.name || user.email}
            </span>
            <button
              onClick={handleAvatarClick}
              className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 hover:border-white/60 transition-all duration-200 cursor-pointer shrink-0"
              title="Alterar foto de perfil"
            >
              {user.avatarUrl ? (
                <img
                  src={`${apiBase}${user.avatarUrl}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">
                  {getInitials(user.name || user.email)}
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        )}
        <button
          onClick={logout}
          className="px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white transition-all duration-200"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
