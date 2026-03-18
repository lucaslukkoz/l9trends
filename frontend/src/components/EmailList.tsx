"use client";

import { EmailSummary } from "@/types/email";
import EmailItem from "./EmailItem";

interface EmailListProps {
  emails: EmailSummary[];
  selectedEmailId: string | null;
  onSelectEmail: (email: EmailSummary) => void;
  onOpenEmail: (emailId: string) => void;
  onDeleteEmail?: (emailId: string) => void;
  onToggleFavorite?: (emailId: string) => void;
}

export default function EmailList({
  emails,
  selectedEmailId,
  onSelectEmail,
  onOpenEmail,
  onDeleteEmail,
  onToggleFavorite,
}: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl flex items-center justify-center py-16 text-[#A5A8AD]">
        Nenhum e-mail encontrado
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto">
      {emails.map((email) => (
        <EmailItem
          key={email.id}
          email={email}
          isSelected={selectedEmailId === email.id}
          onSelect={onSelectEmail}
          onOpen={onOpenEmail}
          onDelete={onDeleteEmail}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
