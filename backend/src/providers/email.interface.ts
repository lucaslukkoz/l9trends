export interface EmailSummaryDTO {
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

export interface EmailDetailDTO {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  labels: string[];
  attachments: { id: number; filename: string; mimeType: string; size: number }[];
  isFavorite?: boolean;
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

export interface AttachmentContentDTO {
  content: Buffer;
  mimeType: string;
  filename: string;
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
  getAttachment(messageId: string, attachmentId: string): Promise<AttachmentContentDTO>;
}
