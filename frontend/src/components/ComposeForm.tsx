"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEmails } from "@/hooks/useEmails";
import { useAccountContext } from "@/context/AccountContext";

export default function ComposeForm() {
  const router = useRouter();
  const { sendEmail } = useEmails();
  const { activeAccountId, accounts } = useAccountContext();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachFile = () => fileInputRef.current?.click();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccountId) {
      setError("Nenhuma conta selecionada. Selecione uma conta primeiro.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendEmail(activeAccountId, { to, cc: cc || undefined, bcc: bcc || undefined, subject, body }, attachedFiles.length > 0 ? attachedFiles : undefined);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Falha ao enviar e-mail.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  const inputClasses =
    "w-full rounded-xl bg-white border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#532E8E] focus:border-transparent outline-none transition-all duration-200";

  const labelClasses = "block text-sm font-medium text-[#A5A8AD] mb-1";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Novo E-mail</h2>
        {activeAccount && (
          <span className="text-xs text-[#A5A8AD]">
            Enviando de: <span className="font-medium text-gray-700">{activeAccount.email}</span>
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="to"
          className={labelClasses}
        >
          Para
        </label>
        <input
          id="to"
          type="email"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className={inputClasses}
          placeholder="destinatario@exemplo.com"
        />
      </div>

      <div className="flex gap-2 text-xs">
        {!showCc && (
          <button type="button" onClick={() => setShowCc(true)} className="text-[#532E8E] hover:text-[#7B5EA7]">
            + CC
          </button>
        )}
        {!showBcc && (
          <button type="button" onClick={() => setShowBcc(true)} className="text-[#532E8E] hover:text-[#7B5EA7]">
            + CCO
          </button>
        )}
      </div>

      {showCc && (
        <div>
          <label className={labelClasses}>CC</label>
          <input type="text" value={cc} onChange={e => setCc(e.target.value)} className={inputClasses} placeholder="cc@exemplo.com" />
        </div>
      )}
      {showBcc && (
        <div>
          <label className={labelClasses}>CCO</label>
          <input type="text" value={bcc} onChange={e => setBcc(e.target.value)} className={inputClasses} placeholder="cco@exemplo.com" />
        </div>
      )}

      <div>
        <label
          htmlFor="subject"
          className={labelClasses}
        >
          Assunto
        </label>
        <input
          id="subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClasses}
          placeholder="Assunto do e-mail"
        />
      </div>

      <div>
        <label
          htmlFor="body"
          className={labelClasses}
        >
          Mensagem
        </label>
        <textarea
          id="body"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className={`${inputClasses} resize-y`}
          placeholder="Escreva sua mensagem aqui..."
        />
      </div>

      {/* Attachment section */}
      <div>
        <button
          type="button"
          onClick={handleAttachFile}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Anexar arquivo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Attached files list */}
      {attachedFiles.length > 0 && (
        <div className="space-y-1.5">
          {attachedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs">
              <svg className="w-4 h-4 text-[#532E8E] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="flex-1 truncate text-gray-700">{file.name}</span>
              <span className="text-[#A5A8AD] shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 text-[#A5A8AD] hover:text-red-500 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !activeAccountId}
        className="rounded-xl bg-gradient-to-r from-[#532E8E] to-[#7B5EA7] px-5 py-2.5 text-sm font-medium text-white hover:from-[#3D2268] hover:to-[#532E8E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
      >
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
