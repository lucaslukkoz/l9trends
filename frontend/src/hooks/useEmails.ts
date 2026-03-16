"use client";

import { useCallback } from "react";
import api from "@/lib/api";
import { EmailDetail, EmailListResponse, SendEmailPayload } from "@/types/email";

export function useEmails() {
  const fetchInbox = useCallback(async (accountId: number, pageToken?: string) => {
    const params: Record<string, string> = {};
    if (pageToken) params.pageToken = pageToken;
    const res = await api.get<EmailListResponse>(`/accounts/${accountId}/emails`, { params });
    return res.data;
  }, []);

  const fetchEmail = useCallback(async (accountId: number, id: string) => {
    const res = await api.get<EmailDetail>(`/accounts/${accountId}/emails/${id}`);
    return res.data;
  }, []);

  const sendEmail = useCallback(async (accountId: number, payload: SendEmailPayload, files?: File[]) => {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('to', payload.to);
      formData.append('subject', payload.subject);
      formData.append('body', payload.body);
      if (payload.cc) formData.append('cc', payload.cc);
      if (payload.bcc) formData.append('bcc', payload.bcc);
      if (payload.inReplyTo) formData.append('inReplyTo', payload.inReplyTo);
      if (payload.references) formData.append('references', payload.references);
      files.forEach(file => formData.append('attachments', file));
      const res = await api.post(`/accounts/${accountId}/emails/send`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } else {
      const res = await api.post(`/accounts/${accountId}/emails/send`, payload);
      return res.data;
    }
  }, []);

  const deleteEmail = useCallback(async (accountId: number, id: string) => {
    const res = await api.delete(`/accounts/${accountId}/emails/${id}`);
    return res.data;
  }, []);

  const markAsRead = useCallback(async (accountId: number, emailId: string) => {
    await api.patch(`/accounts/${accountId}/emails/${emailId}/read`);
  }, []);

  return { fetchInbox, fetchEmail, sendEmail, deleteEmail, markAsRead };
}
