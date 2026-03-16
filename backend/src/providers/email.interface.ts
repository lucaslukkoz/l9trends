export interface EmailSummaryDTO {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
}

export interface EmailDetailDTO {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  labels: string[];
  attachments: { filename: string; mimeType: string; size: number }[];
}

export interface EmailListDTO {
  emails: EmailSummaryDTO[];
  nextPageToken: string | null;
  resultSizeEstimate: number;
}

export interface EmailAttachmentInput {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendMessageOptions {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
  attachments?: EmailAttachmentInput[];
}

export interface IEmailProvider {
  listMessages(
    pageToken?: string,
    maxResults?: number,
  ): Promise<EmailListDTO>;
  getMessage(messageId: string): Promise<EmailDetailDTO>;
  sendMessage(
    options: SendMessageOptions,
  ): Promise<{ messageId: string; threadId: string }>;
  trashMessage(messageId: string): Promise<void>;
}
