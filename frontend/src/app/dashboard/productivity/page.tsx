"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccountContext } from "@/context/AccountContext";
import { useMetrics } from "@/hooks/useMetrics";
import { EmailMetrics } from "@/types/metrics";

export default function ProductivityPage() {
  const { activeAccountId } = useAccountContext();
  const { fetchMetrics } = useMetrics();
  const [metrics, setMetrics] = useState<EmailMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    if (!activeAccountId) return;
    setLoading(true);
    try {
      const data = await fetchMetrics(activeAccountId);
      setMetrics(data);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [activeAccountId, fetchMetrics]);

  useEffect(() => {
    if (activeAccountId) {
      loadMetrics();
    } else {
      setLoading(false);
    }
  }, [activeAccountId, loadMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass rounded-2xl p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#532E8E] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-sm text-[#A5A8AD]">Nao foi possivel carregar as metricas</p>
        </div>
      </div>
    );
  }

  const maxBarValue = Math.max(
    ...metrics.emailsByDay.map((d) => d.sent + d.received),
    1
  );

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      {/* Header */}
      <div className="glass rounded-2xl px-6 py-4 flex items-center gap-3">
        <svg className="w-5 h-5 text-[#532E8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 className="text-lg font-bold text-gray-900">Produtividade</h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-[#532E8E]">{metrics.emailsSentToday}</p>
          <p className="text-xs text-[#A5A8AD] mt-1">Enviados Hoje</p>
          <p className="text-xs text-gray-500 mt-0.5">{metrics.emailsSentThisWeek} esta semana</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-[#532E8E]">{metrics.emailsReceivedToday}</p>
          <p className="text-xs text-[#A5A8AD] mt-1">Recebidos Hoje</p>
          <p className="text-xs text-gray-500 mt-0.5">{metrics.emailsReceivedThisWeek} esta semana</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-[#532E8E]">{metrics.unreadCount}</p>
          <p className="text-xs text-[#A5A8AD] mt-1">Nao Lidos</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-[#532E8E]">
            {metrics.averageResponseTimeMinutes !== null
              ? `${Math.round(metrics.averageResponseTimeMinutes)}min`
              : "--"}
          </p>
          <p className="text-xs text-[#A5A8AD] mt-1">Tempo Medio de Resposta</p>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Atividade Semanal</h3>
        <div className="flex items-end gap-3 h-40">
          {metrics.emailsByDay.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '120px' }}>
                <div className="w-full flex flex-col justify-end h-full gap-0.5">
                  {day.sent > 0 && (
                    <div
                      className="w-full bg-[#532E8E] rounded-t-sm"
                      style={{
                        height: `${(day.sent / maxBarValue) * 100}%`,
                        minHeight: '4px',
                      }}
                      title={`Enviados: ${day.sent}`}
                    />
                  )}
                  {day.received > 0 && (
                    <div
                      className="w-full bg-gray-300 rounded-t-sm"
                      style={{
                        height: `${(day.received / maxBarValue) * 100}%`,
                        minHeight: '4px',
                      }}
                      title={`Recebidos: ${day.received}`}
                    />
                  )}
                </div>
              </div>
              <span className="text-[10px] text-[#A5A8AD] capitalize">{day.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#532E8E]" />
            <span className="text-xs text-[#A5A8AD]">Enviados</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gray-300" />
            <span className="text-xs text-[#A5A8AD]">Recebidos</span>
          </div>
        </div>
      </div>

      {/* Top Senders */}
      {metrics.topSenders.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Principais Remetentes</h3>
          <div className="space-y-3">
            {metrics.topSenders.map((sender, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#532E8E] w-5 shrink-0">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{sender.email}</p>
                </div>
                <span className="text-xs font-medium text-[#A5A8AD] shrink-0">
                  {sender.count} {sender.count === 1 ? "e-mail" : "e-mails"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
