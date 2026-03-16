"use client";

import { useState, useRef } from "react";
import { EmailDetail } from "@/types/email";
import { useEmails } from "@/hooks/useEmails";

interface ComposeModalProps {
  mode: "new" | "reply" | "forward";
  originalEmail?: EmailDetail | null;
  accountId: number;
  onClose: () => void;
  onSent: () => void;
}

export default function ComposeModal({
  mode,
  originalEmail,
  accountId,
  onClose,
  onSent,
}: ComposeModalProps) {
  const { sendEmail } = useEmails();

  const buildInitialTo = () => {
    if (mode === "reply" && originalEmail) return originalEmail.from;
    return "";
  };

  const buildInitialSubject = () => {
    if (!originalEmail) return "";
    const subj = originalEmail.subject;
    if (mode === "reply") {
      return subj.startsWith("Re:") ? subj : `Re: ${subj}`;
    }
    if (mode === "forward") {
      return subj.startsWith("Fwd:") ? subj : `Fwd: ${subj}`;
    }
    return "";
  };

  const buildInitialBody = () => {
    if (!originalEmail) return "";
    if (mode === "reply") {
      return `<br/><br/>
<div style="border-left:2px solid #4b5563;padding-left:12px;margin-top:16px;color:#9ca3af">
<p><strong>Em ${originalEmail.date}, ${originalEmail.from} escreveu:</strong></p>
${originalEmail.body}
</div>`;
    }
    if (mode === "forward") {
      return `<br/><br/>
<div style="border-top:1px solid #4b5563;padding-top:12px;margin-top:16px">
<p><strong>---------- Mensagem encaminhada ----------</strong></p>
<p>De: ${originalEmail.from}</p>
<p>Data: ${originalEmail.date}</p>
<p>Assunto: ${originalEmail.subject}</p>
<p>Para: ${originalEmail.to}</p>
<br/>
${originalEmail.body}
</div>`;
    }
    return "";
  };

  const [to, setTo] = useState(buildInitialTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState(buildInitialSubject);
  const [body, setBody] = useState("");
  const [quotedBody] = useState(buildInitialBody);
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

  const titleMap = {
    new: "Novo E-mail",
    reply: "Responder",
    forward: "Encaminhar",
  };

  const inputClasses =
    "w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#532E8E] focus:border-transparent";

  const labelClasses = "block text-sm font-medium text-[#A5A8AD] mb-1";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fullBody = body + quotedBody;
      await sendEmail(accountId, {
        to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject,
        body: fullBody,
        ...(mode === "reply" && originalEmail
          ? {
              inReplyTo: originalEmail.id,
              references: originalEmail.id,
            }
          : {}),
      }, attachedFiles.length > 0 ? attachedFiles : undefined);
      onSent();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Falha ao enviar e-mail.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-gray-200 shadow-lg rounded-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{titleMap[mode]}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className={labelClasses}>Para</label>
            <input
              type="text"
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
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className={inputClasses}
                placeholder="cc@exemplo.com"
              />
            </div>
          )}

          {showBcc && (
            <div>
              <label className={labelClasses}>CCO</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className={inputClasses}
                placeholder="cco@exemplo.com"
              />
            </div>
          )}

          <div>
            <label className={labelClasses}>Assunto</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClasses}
              placeholder="Assunto do e-mail"
            />
          </div>

          <div>
            <label className={labelClasses}>Mensagem</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className={`${inputClasses} resize-y`}
              placeholder="Escreva sua mensagem..."
            />
          </div>

          {quotedBody && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 overflow-y-auto max-h-48">
              <p className="text-xs text-[#A5A8AD] mb-2 font-medium">
                {mode === "reply" ? "Mensagem citada" : "Mensagem encaminhada"}
              </p>
              <div
                className="prose prose-sm max-w-none text-gray-700 border-l-2 border-gray-300 pl-3"
                dangerouslySetInnerHTML={{ __html: quotedBody }}
              />
            </div>
          )}

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

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-[#532E8E] to-[#7B5EA7] px-5 py-2.5 text-sm font-medium text-white hover:from-[#3D2268] hover:to-[#532E8E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gray-50 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 border border-gray-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
