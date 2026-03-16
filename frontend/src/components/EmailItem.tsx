"use client";

import { EmailSummary } from "@/types/email";

interface EmailItemProps {
  email: EmailSummary;
  isSelected: boolean;
  onSelect: (email: EmailSummary) => void;
  onOpen: (emailId: string) => void;
  onDelete?: (emailId: string) => void;
}

export default function EmailItem({
  email,
  isSelected,
  onSelect,
  onOpen,
  onDelete,
}: EmailItemProps) {
  const dateStr = new Date(email.date).toLocaleDateString("pt-BR", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      onClick={() => onSelect(email)}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all duration-200 border ${
        isSelected
          ? "bg-[#532E8E]/10 border-[#532E8E]/30"
          : "border-transparent hover:bg-gray-50"
      } ${!email.isRead ? "border-l-2 border-l-[#532E8E]" : ""}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate ${
              !email.isRead ? "font-bold text-gray-900" : "text-gray-700"
            }`}
          >
            {email.from}
          </span>
          <span className="text-xs text-[#A5A8AD] whitespace-nowrap">
            {dateStr}
          </span>
        </div>
        <p
          className={`text-sm truncate ${
            !email.isRead ? "font-semibold text-gray-900" : "text-gray-700"
          }`}
        >
          {email.subject}
        </p>
        <p className="text-xs text-[#A5A8AD] truncate">{email.snippet}</p>
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(email.id);
          }}
          className="shrink-0 self-center p-1.5 rounded-lg text-[#A5A8AD] hover:text-red-500 hover:bg-red-50 transition-all duration-200"
          title="Excluir"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpen(email.id);
        }}
        className="shrink-0 self-center rounded-lg bg-[#532E8E]/10 px-3 py-1.5 text-xs font-medium text-[#532E8E] hover:bg-[#532E8E]/20 transition-all duration-200 border border-[#532E8E]/30"
      >
        Abrir
      </button>
    </div>
  );
}
