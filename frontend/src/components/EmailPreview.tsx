"use client";

import { EmailDetail } from "@/types/email";

interface EmailPreviewProps {
  email: EmailDetail | null;
  loading: boolean;
  onOpen: (emailId: string) => void;
  onDelete: (emailId: string) => void;
  onReply: (email: EmailDetail) => void;
  onForward: (email: EmailDetail) => void;
}

export default function EmailPreview({
  email,
  loading,
  onOpen,
  onDelete,
  onReply,
  onForward,
}: EmailPreviewProps) {
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
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          {email.subject}
        </h2>
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
