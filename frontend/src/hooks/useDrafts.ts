"use client";

import { useCallback } from "react";
import api from "@/lib/api";
import { Draft, DraftListResponse } from "@/types/email";

export function useDrafts() {
  const fetchDrafts = useCallback(async (accountId: number, pageToken?: string) => {
    const params: Record<string, string> = {};
    if (pageToken) params.pageToken = pageToken;
    const res = await api.get<DraftListResponse>(`/accounts/${accountId}/drafts`, { params });
    return res.data;
  }, []);

  const fetchDraft = useCallback(async (accountId: number, draftId: number) => {
    const res = await api.get<Draft>(`/accounts/${accountId}/drafts/${draftId}`);
    return res.data;
  }, []);

  const saveDraft = useCallback(async (accountId: number, data: Partial<Draft>) => {
    const res = await api.post<Draft>(`/accounts/${accountId}/drafts`, data);
    return res.data;
  }, []);

  const updateDraft = useCallback(async (accountId: number, draftId: number, data: Partial<Draft>) => {
    const res = await api.put<Draft>(`/accounts/${accountId}/drafts/${draftId}`, data);
    return res.data;
  }, []);

  const deleteDraft = useCallback(async (accountId: number, draftId: number) => {
    await api.delete(`/accounts/${accountId}/drafts/${draftId}`);
  }, []);

  return { fetchDrafts, fetchDraft, saveDraft, updateDraft, deleteDraft };
}
