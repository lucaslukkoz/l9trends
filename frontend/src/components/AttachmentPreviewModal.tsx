"use client";

import { useState } from "react";

interface AttachmentPreviewModalProps {
  filename: string;
  mimeType: string;
  size: number;
  previewUrl: string;
  downloadUrl: string;
  onClose: () => void;
}

export default function AttachmentPreviewModal({
  filename,
  mimeType,
  previewUrl,
  downloadUrl,
  onClose,
}: AttachmentPreviewModalProps) {
  const [loading, setLoading] = useState(true);

  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";
  const isText = mimeType.startsWith("text/");

  const token = typeof window !== "undefined" ? localStorage.getItem("l9trends_token") : null;
  const authUrl = (url: string) => `${url}${url.includes("?") ? "&" : "?"}token=${token}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-gray-200 shadow-lg rounded-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <svg className="w-5 h-5 text-[#532E8E] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900 truncate">{filename}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-[300px]">
          {isImage && (
            <>
              {loading && (
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#532E8E] border-t-transparent" />
              )}
              <img
                src={authUrl(previewUrl)}
                alt={filename}
                className={`max-w-full max-h-[60vh] rounded-lg ${loading ? "hidden" : ""}`}
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </>
          )}

          {isPdf && (
            <iframe
              src={authUrl(previewUrl)}
              className="w-full h-[60vh] rounded-lg border border-gray-200"
              title={filename}
            />
          )}

          {isText && (
            <iframe
              src={authUrl(previewUrl)}
              className="w-full h-[60vh] rounded-lg border border-gray-200 bg-gray-50"
              title={filename}
            />
          )}

          {!isImage && !isPdf && !isText && (
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-[#A5A8AD] mb-2">Pré-visualização não disponível para este tipo de arquivo</p>
              <p className="text-xs text-[#A5A8AD]">{mimeType}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
          <a
            href={authUrl(downloadUrl)}
            download={filename}
            className="rounded-xl bg-gradient-to-r from-[#532E8E] to-[#7B5EA7] px-5 py-2.5 text-sm font-medium text-white hover:from-[#3D2268] hover:to-[#532E8E] transition-all duration-200 shadow-md inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar
          </a>
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-50 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 border border-gray-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
