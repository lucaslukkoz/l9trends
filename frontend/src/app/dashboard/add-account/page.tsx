"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccounts } from "@/hooks/useAccounts";
import { useAccountContext } from "@/context/AccountContext";

export default function AddAccountPage() {
  const router = useRouter();
  const { addImapAccount } = useAccounts();
  const { refreshAccounts } = useAccountContext();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState(993);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [useTls, setUseTls] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await addImapAccount({
        email,
        displayName: displayName || undefined,
        imapHost,
        imapPort,
        smtpHost,
        smtpPort,
        username,
        password,
        useTls,
      });
      await refreshAccounts();
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Falha ao adicionar conta. Verifique suas credenciais.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full rounded-xl bg-white border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#532E8E] focus:ring-2 focus:ring-[#532E8E]/30 outline-none transition-all duration-200";

  const labelClasses = "block text-sm font-medium text-[#A5A8AD] mb-1";

  return (
    <div className="flex items-center justify-center h-full p-6 overflow-y-auto">
      <div className="glass rounded-2xl p-8 w-full max-w-lg">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-[#532E8E] hover:bg-gray-50 transition-all duration-200 border border-gray-200"
        >
          &larr; Voltar ao Painel
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Adicionar Conta IMAP</h2>
        <p className="text-sm text-[#A5A8AD] mb-6">
          Conecte uma conta de e-mail usando credenciais IMAP/SMTP.
        </p>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelClasses}>Endere&ccedil;o de E-mail</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              placeholder="usuario@exemplo.com"
            />
          </div>

          <div>
            <label htmlFor="displayName" className={labelClasses}>Nome de Exibi&ccedil;&atilde;o (opcional)</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClasses}
              placeholder="Meu E-mail de Trabalho"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="imapHost" className={labelClasses}>Host IMAP</label>
              <input
                id="imapHost"
                type="text"
                required
                value={imapHost}
                onChange={(e) => setImapHost(e.target.value)}
                className={inputClasses}
                placeholder="imap.exemplo.com"
              />
            </div>
            <div>
              <label htmlFor="imapPort" className={labelClasses}>Porta IMAP</label>
              <input
                id="imapPort"
                type="number"
                required
                value={imapPort}
                onChange={(e) => setImapPort(Number(e.target.value))}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="smtpHost" className={labelClasses}>Host SMTP</label>
              <input
                id="smtpHost"
                type="text"
                required
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className={inputClasses}
                placeholder="smtp.exemplo.com"
              />
            </div>
            <div>
              <label htmlFor="smtpPort" className={labelClasses}>Porta SMTP</label>
              <input
                id="smtpPort"
                type="number"
                required
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label htmlFor="username" className={labelClasses}>Usu&aacute;rio</label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClasses}
              placeholder="usuario@exemplo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClasses}>Senha</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              placeholder="Senha do aplicativo ou da conta"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="useTls"
              type="checkbox"
              checked={useTls}
              onChange={(e) => setUseTls(e.target.checked)}
              className="rounded border-gray-200 bg-white text-[#532E8E] focus:ring-[#532E8E]"
            />
            <label htmlFor="useTls" className="text-sm text-[#A5A8AD]">
              Usar criptografia TLS
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#532E8E] to-[#7B5EA7] px-5 py-2.5 text-sm font-medium text-white hover:from-[#3D2268] hover:to-[#532E8E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
          >
            {loading ? "Adicionando Conta..." : "Adicionar Conta"}
          </button>
        </form>
      </div>
    </div>
  );
}
