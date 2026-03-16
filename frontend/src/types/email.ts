export interface EmailSummary {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
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
    filename: string;
    mimeType: string;
    size: number;
  }[];
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
}
