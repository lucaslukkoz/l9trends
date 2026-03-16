"use client";

import { EmailDetail } from "@/types/email";

interface EmailViewProps {
  email: EmailDetail;
  onDelete: () => void;
}

export default function EmailView({ email, onDelete }: EmailViewProps) {
  const dateStr = new Date(email.date).toLocaleString();

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
      <div className="mb-4 border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
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
        {email.labels.length > 0 && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {email.labels.map((label) => (
              <span
                key={label}
                className="inline-block rounded-lg bg-[#532E8E]/10 px-2.5 py-1 text-xs font-medium text-[#532E8E] border border-[#532E8E]/30"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />
      </div>

      {email.attachments.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Anexos
          </h3>
          <ul className="space-y-1">
            {email.attachments.map((att, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200"
              >
                {att.filename}{" "}
                <span className="text-[#A5A8AD]">
                  ({att.mimeType}, {Math.round(att.size / 1024)} KB)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onDelete}
        className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-all duration-200 border border-red-200"
      >
        Excluir
      </button>
    </div>
  );
}
