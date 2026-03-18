"use client";

import { useState } from "react";
import { EmailDetail } from "@/types/email";
import { useEmails } from "@/hooks/useEmails";
import AttachmentPreviewModal from "./AttachmentPreviewModal";

interface EmailPreviewProps {
  email: EmailDetail | null;
  loading: boolean;
  onOpen: (emailId: string) => void;
  onDelete: (emailId: string) => void;
  onReply: (email: EmailDetail) => void;
  onForward: (email: EmailDetail) => void;
  onToggleFavorite?: (emailId: string) => void;
  accountId?: number;
}

export default function EmailPreview({
  email,
  loading,
  onOpen,
  onDelete,
  onReply,
  onForward,
  onToggleFavorite,
  accountId,
}: EmailPreviewProps) {
  const { getAttachmentUrl } = useEmails();
  const [previewAttachment, setPreviewAttachment] = useState<{
    id: number; filename: string; mimeType: string; size: number;
  } | null>(null);
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#532E8E] border-t-transparent" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex-1 flex flex-col items-center justify-center text-[#A5A8AD] gap-3">
        <svg
          className="w-12 h-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm">Selecione um e-mail para visualizar</p>
      </div>
    );
  }

  const dateStr = new Date(email.date).toLocaleString();

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="text-lg font-bold text-gray-900">
            {email.subject}
          </h2>
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(email.id)}
              className="shrink-0 p-1.5 rounded-lg transition-all duration-200 hover:bg-yellow-50"
              title={email.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <svg
                className={`w-5 h-5 ${email.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                fill={email.isFavorite ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-sm text-[#A5A8AD] space-y-1">
          <p>
            <span className="font-medium text-gray-700">De:</span>{" "}
            {email.from}
          </p>
          <p>
            <span className="font-medium text-gray-700">Para:</span> {email.to}
          </p>
          <p>
            <span className="font-medium text-gray-700">Data:</span> {dateStr}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />
      </div>

      {/* Attachments */}
      {email.attachments && email.attachments.length > 0 && accountId && (
        <div className="px-5 py-3 border-t border-gray-200">
          <p className="text-xs font-medium text-[#A5A8AD] mb-2">
            Anexos ({email.attachments.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {email.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs"
              >
                <svg className="w-4 h-4 text-[#532E8E] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-gray-700 truncate max-w-[120px]">{att.filename}</span>
                <span className="text-[#A5A8AD] shrink-0">{(att.size / 1024).toFixed(0)} KB</span>
                <button
                  onClick={() => setPreviewAttachment(att)}
                  className="shrink-0 p-1 rounded text-[#532E8E] hover:bg-[#532E8E]/10 transition-colors"
                  title="Pré-visualizar"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <a
                  href={getAttachmentUrl(accountId, email.id, att.id, false)}
                  download={att.filename}
                  className="shrink-0 p-1 rounded text-[#532E8E] hover:bg-[#532E8E]/10 transition-colors"
                  title="Baixar"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment && accountId && (
        <AttachmentPreviewModal
          filename={previewAttachment.filename}
          mimeType={previewAttachment.mimeType}
          size={previewAttachment.size}
          previewUrl={getAttachmentUrl(accountId, email.id, previewAttachment.id, true)}
          downloadUrl={getAttachmentUrl(accountId, email.id, previewAttachment.id, false)}
          onClose={() => setPreviewAttachment(null)}
        />
      )}

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 flex items-center gap-3">
        <button
          onClick={() => onReply(email)}
          className="rounded-xl bg-[#532E8E]/10 px-4 py-2 text-sm font-medium text-[#532E8E] hover:bg-[#532E8E]/20 transition-all duration-200 border border-[#532E8E]/30"
        >
          Responder
        </button>
        <button
          onClick={() => onForward(email)}
          className="rounded-xl bg-[#532E8E]/10 px-4 py-2 text-sm font-medium text-[#532E8E] hover:bg-[#532E8E]/20 transition-all duration-200 border border-[#532E8E]/30"
        >
          Encaminhar
        </button>
        <button
          onClick={() => onDelete(email.id)}
          className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-all duration-200 border border-red-200"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
