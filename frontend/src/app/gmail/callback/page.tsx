"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function GmailCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      handleOAuthCallback(token)
        .then(() => {
          router.replace("/dashboard");
        })
        .catch(() => {
          setError(true);
        });
    } else {
      setError(true);
    }
  }, [searchParams, router, handleOAuthCallback]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md glass rounded-2xl p-8 text-center">
          <div className="text-lg font-medium text-red-600 mb-4">
            Falha na autentica&ccedil;&atilde;o. Tente novamente.
          </div>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-gradient-to-r from-[#532E8E] to-[#7B5EA7] px-4 py-2 text-sm font-medium text-white hover:from-[#3D2268] hover:to-[#532E8E] transition-all duration-200 shadow-md"
          >
            Voltar ao Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md glass rounded-2xl p-8 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#532E8E] border-t-transparent mx-auto mb-4" />
        <div className="text-lg font-medium text-gray-900">
          Conectando seu Gmail...
        </div>
      </div>
    </div>
  );
}
