"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { EmailDetail, Draft } from "@/types/email";
import { useEmails } from "@/hooks/useEmails";
import { useAccounts } from "@/hooks/useAccounts";
import { useDrafts } from "@/hooks/useDrafts";

interface ComposeModalProps {
  mode: "new" | "reply" | "forward";
  originalEmail?: EmailDetail | null;
  accountId: number;
  onClose: () => void;
  onSent: () => void;
  initialDraft?: Draft | null;
}

export default function ComposeModal({
  mode,
  originalEmail,
  accountId,
  onClose,
  onSent,
  initialDraft,
}: ComposeModalProps) {
  const { sendEmail } = useEmails();
  const { getSignature } = useAccounts();
  const { saveDraft, updateDraft } = useDrafts();
  const [signatureHtml, setSignatureHtml] = useState<string | null>(null);
  const [signatureIncluded, setSignatureIncluded] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(initialDraft?.id || null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

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

  const [to, setTo] = useState(initialDraft?.to || buildInitialTo());
  const [cc, setCc] = useState(initialDraft?.cc || "");
  const [bcc, setBcc] = useState(initialDraft?.bcc || "");
  const [showCc, setShowCc] = useState(!!initialDraft?.cc);
  const [showBcc, setShowBcc] = useState(!!initialDraft?.bcc);
  const [subject, setSubject] = useState(initialDraft?.subject || buildInitialSubject());
  const [body, setBody] = useState(initialDraft?.bodyHtml || "");
  const [quotedBody] = useState(initialDraft ? "" : buildInitialBody());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set initial content in contentEditable
  useEffect(() => {
    if (bodyRef.current && !bodyRef.current.innerHTML) {
      bodyRef.current.innerHTML = body || "";
    }
  }, []);

  // Fetch signature on mount
  useEffect(() => {
    getSignature(accountId).then((sig) => {
      if (sig.signatureEnabled && sig.signatureHtml) {
        setSignatureHtml(sig.signatureHtml);
      }
    }).catch(() => {});
  }, [accountId, getSignature]);

  // Get current body from contentEditable (excluding signature block)
  const getBodyContent = useCallback(() => {
    if (!bodyRef.current) return body;
    const clone = bodyRef.current.cloneNode(true) as HTMLDivElement;
    const sigBlock = clone.querySelector('[data-signature="true"]');
    if (sigBlock) sigBlock.remove();
    return clone.innerHTML;
  }, [body]);

  // Handle signature toggle
  const handleToggleSignature = useCallback(() => {
    if (!signatureHtml || !bodyRef.current) return;

    if (!signatureIncluded) {
      // Add signature
      const sigBlock = document.createElement("div");
      sigBlock.setAttribute("data-signature", "true");
      sigBlock.setAttribute("contenteditable", "false");
      sigBlock.style.marginTop = "16px";
      sigBlock.style.paddingTop = "8px";
      sigBlock.style.borderTop = "1px solid #e5e7eb";
      sigBlock.innerHTML = `<div style="color:#9ca3af;font-size:12px;margin-bottom:4px">--</div>${signatureHtml}`;
      bodyRef.current.appendChild(sigBlock);
      setSignatureIncluded(true);
    } else {
      // Remove signature
      const sigBlock = bodyRef.current.querySelector('[data-signature="true"]');
      if (sigBlock) sigBlock.remove();
      setSignatureIncluded(false);
    }
    // Update body state
    setBody(getBodyContent());
  }, [signatureHtml, signatureIncluded, getBodyContent]);

  // Auto-save draft with debounce
  const handleAutoSave = useCallback(async () => {
    const currentBody = getBodyContent();
    const draftData = { to, cc, bcc, subject, bodyHtml: currentBody + quotedBody, inReplyTo: originalEmail?.id, references: originalEmail?.id };
    try {
      if (currentDraftId) {
        await updateDraft(accountId, currentDraftId, draftData);
      } else {
        const saved = await saveDraft(accountId, draftData);
        setCurrentDraftId(saved.id);
      }
    } catch {
      // silent auto-save failure
    }
  }, [to, cc, bcc, subject, getBodyContent, quotedBody, accountId, currentDraftId, originalEmail, saveDraft, updateDraft]);

  useEffect(() => {
    if (!to && !subject && !body) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(handleAutoSave, 5000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [to, cc, bcc, subject, body, handleAutoSave]);

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

  const handleBodyInput = () => {
    setBody(getBodyContent());
  };

  const handleSaveDraft = async () => {
    const currentBody = getBodyContent();
    const draftData = { to, cc, bcc, subject, bodyHtml: currentBody + quotedBody, inReplyTo: originalEmail?.id, references: originalEmail?.id };
    try {
      if (currentDraftId) {
        await updateDraft(accountId, currentDraftId, draftData);
      } else {
        const saved = await saveDraft(accountId, draftData);
        setCurrentDraftId(saved.id);
      }
    } catch {
      setError("Falha ao salvar rascunho.");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    try {
      // Get full body including signature if present
      const editorContent = bodyRef.current?.innerHTML || body;
      const fullBody = editorContent + quotedBody;
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
        draftId: currentDraftId || undefined,
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
            <div
              ref={bodyRef}
              contentEditable
              onInput={handleBodyInput}
              className="w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#532E8E] focus:border-transparent min-h-[200px] max-h-[400px] overflow-y-auto"
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              data-placeholder="Escreva sua mensagem..."
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

          {/* Attachment & Signature section */}
          <div className="flex items-center gap-2 flex-wrap">
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
            <button
              type="button"
              onClick={handleToggleSignature}
              title={!signatureHtml ? "Configure uma assinatura nas Configurações" : (signatureIncluded ? "Clique para remover assinatura" : "Clique para incluir assinatura")}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                signatureIncluded && signatureHtml
                  ? "bg-[#532E8E]/10 border-[#532E8E]/30 text-[#532E8E]"
                  : !signatureHtml
                    ? "bg-gray-100 border-gray-300 text-gray-500"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {signatureIncluded && signatureHtml ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                )}
              </svg>
              Assinatura
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
              onClick={handleSaveDraft}
              className="rounded-xl bg-gray-50 px-5 py-2.5 text-sm font-medium text-[#532E8E] hover:bg-gray-100 transition-all duration-200 border border-gray-200"
            >
              Salvar Rascunho
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
