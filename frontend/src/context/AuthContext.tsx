"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { getToken, setToken, removeToken } from "@/lib/auth";
import { User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGmail: () => Promise<void>;
  handleOAuthCallback: (token: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      api
        .get<User>("/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => {
          removeToken();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ id: number; name: string; email: string; token: string }>('/auth/login', { email, password });
    setToken(res.data.token);
    const profile = await api.get<User>('/auth/me');
    setUser(profile.data);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.post<{ id: number; name: string; email: string; token: string }>('/auth/register', { name, email, password });
    setToken(res.data.token);
    const profile = await api.get<User>('/auth/me');
    setUser(profile.data);
  }, []);

  const loginWithGmail = useCallback(async () => {
    const res = await api.get<{ url: string }>("/gmail/connect");
    window.location.href = res.data.url;
  }, []);

  const handleOAuthCallback = useCallback(async (token: string) => {
    setToken(token);
    const res = await api.get<User>("/auth/me");
    setUser(res.data);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGmail, handleOAuthCallback, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
