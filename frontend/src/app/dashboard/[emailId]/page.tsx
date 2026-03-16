"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEmails } from "@/hooks/useEmails";
import { useAccountContext } from "@/context/AccountContext";
import { EmailDetail } from "@/types/email";
import EmailView from "@/components/EmailView";

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { fetchEmail, deleteEmail } = useEmails();
  const { activeAccountId } = useAccountContext();
  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const emailId = params.emailId as string;

  useEffect(() => {
    if (!activeAccountId) return;
    fetchEmail(activeAccountId, emailId)
      .then(setEmail)
      .catch(() => setError("Falha ao carregar e-mail."))
      .finally(() => setLoading(false));
  }, [emailId, activeAccountId, fetchEmail]);

  const handleDelete = async () => {
    if (!activeAccountId) return;
    try {
      await deleteEmail(activeAccountId, emailId);
      router.push("/dashboard");
    } catch {
      alert("Falha ao excluir e-mail.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass rounded-2xl p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#532E8E] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-red-600 mb-4">{error || "E-mail não encontrado."}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#532E8E] hover:bg-gray-50 transition-all duration-200 border border-gray-200"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-[#532E8E] hover:bg-gray-50 transition-all duration-200 border border-gray-200"
      >
        &larr; Voltar
      </button>
      <EmailView email={email} onDelete={handleDelete} />
    </div>
  );
}
