export interface EmailSummary {
  id: string;
  threadId: string;
  from: string;
  to?: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
  isFavorite?: boolean;
}

export interface EmailDetail {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  labels: string[];
  attachments: {
    id: number;
    filename: string;
    mimeType: string;
    size: number;
  }[];
  isFavorite?: boolean;
}

export interface EmailListResponse {
  emails: EmailSummary[];
  nextPageToken: string | null;
  resultSizeEstimate: number;
}

export interface SendEmailPayload {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
  draftId?: number;
}

export interface Draft {
  id: number;
  to: string | null;
  cc: string | null;
  bcc: string | null;
  subject: string | null;
  bodyHtml: string | null;
  inReplyTo: string | null;
  references: string | null;
  updatedAt: string;
}

export interface DraftListResponse {
  drafts: Draft[];
  nextPageToken: string | null;
}
