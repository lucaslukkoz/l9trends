"use client";

import { useCallback } from "react";
import api from "@/lib/api";
import { EmailMetrics } from "@/types/metrics";

export function useMetrics() {
  const fetchMetrics = useCallback(async (accountId: number) => {
    const res = await api.get<EmailMetrics>(`/accounts/${accountId}/metrics`);
    return res.data;
  }, []);

  return { fetchMetrics };
}
