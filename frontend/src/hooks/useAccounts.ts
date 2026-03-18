"use client";

import { useCallback } from 'react';
import api from '@/lib/api';
import { EmailAccount, AddImapAccountData } from '@/types/account';

export function useAccounts() {
  const fetchAccounts = useCallback(async (): Promise<EmailAccount[]> => {
    const res = await api.get<{ accounts: EmailAccount[] }>('/accounts');
    return res.data.accounts;
  }, []);

  const addImapAccount = useCallback(async (data: AddImapAccountData): Promise<EmailAccount> => {
    const res = await api.post<EmailAccount>('/accounts/imap', data);
    return res.data;
  }, []);

  const removeAccount = useCallback(async (accountId: number): Promise<void> => {
    await api.delete(`/accounts/${accountId}`);
  }, []);

  const triggerSync = useCallback(async (accountId: number): Promise<void> => {
    await api.post(`/accounts/${accountId}/sync`);
  }, []);

  const getSignature = useCallback(async (accountId: number) => {
    const res = await api.get<{ signatureHtml: string | null; signatureEnabled: boolean }>(`/accounts/${accountId}/signature`);
    return res.data;
  }, []);

  const updateSignature = useCallback(async (accountId: number, signatureHtml: string, enabled: boolean) => {
    const res = await api.put(`/accounts/${accountId}/signature`, { signatureHtml, enabled });
    return res.data;
  }, []);

  return { fetchAccounts, addImapAccount, removeAccount, triggerSync, getSignature, updateSignature };
}
