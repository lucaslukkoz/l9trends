"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login, loginWithGmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signingInGmail, setSigningInGmail] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "E-mail ou senha incorretos. Tente novamente.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGmailSignIn = async () => {
    setError("");
    setSigningInGmail(true);
    try {
      await loginWithGmail();
    } catch {
      setError("Falha ao iniciar login com Gmail. Tente novamente.");
      setSigningInGmail(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass rounded-2xl p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#532E8E] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md glass rounded-2xl p-8 text-center">
        <p className="text-[#A5A8AD] mb-8">Painel de E-mail</p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#A5A8AD] mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#532E8E] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#A5A8AD] mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#532E8E] focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-[#532E8E] to-[#7B5EA7] px-4 py-3 text-sm font-medium text-white hover:from-[#3D2268] hover:to-[#532E8E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-sm text-[#A5A8AD]">ou</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <button
          onClick={handleGmailSignIn}
          disabled={signingInGmail}
          className="w-full rounded-xl bg-gradient-to-r from-[#532E8E] to-[#7B5EA7] px-4 py-3 text-sm font-medium text-white hover:from-[#3D2268] hover:to-[#532E8E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
        >
          {signingInGmail ? "Redirecionando..." : "Entrar com Gmail"}
        </button>

        <p className="mt-6 text-sm text-[#A5A8AD]">
          N&atilde;o tem uma conta?{" "}
          <Link href="/register" className="text-[#532E8E] hover:text-[#7B5EA7] font-medium">
            Criar uma
          </Link>
        </p>
      </div>
    </div>
  );
}
