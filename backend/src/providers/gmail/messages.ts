import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import { BadGatewayError } from '../../utils/errors';
import { SendMessageOptions } from '../email.interface';

function getGmailClient(client: OAuth2Client): gmail_v1.Gmail {
  return google.gmail({ version: 'v1', auth: client });
}

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
): string {
  if (!headers) return '';
  const header = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase(),
  );
  return header?.value || '';
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data, 'base64url').toString('utf8');
}

function findBodyPart(
  payload: gmail_v1.Schema$MessagePart,
  mimeType: string,
): string | null {
  if (payload.mimeType === mimeType && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const result = findBodyPart(part, mimeType);
      if (result) return result;
    }
  }

  return null;
}

function extractAttachments(
  payload: gmail_v1.Schema$MessagePart,
): Array<{ id: number; filename: string; mimeType: string; size: number }> {
  const attachments: Array<{
    id: number;
    filename: string;
    mimeType: string;
    size: number;
  }> = [];

  let idCounter = 0;

  function walk(part: gmail_v1.Schema$MessagePart) {
    if (part.filename && part.filename.length > 0 && part.body) {
      attachments.push({
        id: idCounter++,
        filename: part.filename,
        mimeType: part.mimeType || 'application/octet-stream',
        size: part.body.size || 0,
      });
    }
    if (part.parts) {
      for (const child of part.parts) {
        walk(child);
      }
    }
  }

  walk(payload);
  return attachments;
}

export async function listMessages(
  client: OAuth2Client,
  pageToken?: string,
  maxResults: number = 20,
): Promise<{
  emails: Array<{
    id: string;
    threadId: string;
    from: string;
    subject: string;
    snippet: string;
    date: string;
    isRead: boolean;
  }>;
  nextPageToken: string | null;
  resultSizeEstimate: number;
}> {
  const gmail = getGmailClient(client);

  try {
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken: pageToken || undefined,
    });

    const messages = listResponse.data.messages || [];
    const nextPageToken = listResponse.data.nextPageToken || null;
    const resultSizeEstimate = listResponse.data.resultSizeEstimate || 0;

    // Fetch headers for each message
    const emails = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        });

        const headers = detail.data.payload?.headers;
        const labelIds = detail.data.labelIds || [];

        return {
          id: detail.data.id!,
          threadId: detail.data.threadId!,
          from: getHeader(headers, 'From'),
          subject: getHeader(headers, 'Subject'),
          snippet: detail.data.snippet || '',
          date: getHeader(headers, 'Date'),
          isRead: !labelIds.includes('UNREAD'),
        };
      }),
    );

    return { emails, nextPageToken, resultSizeEstimate };
  } catch (error: any) {
    throw new BadGatewayError(
      `Gmail API error: ${error.message || 'Failed to list messages'}`,
    );
  }
}

export async function getMessage(
  client: OAuth2Client,
  messageId: string,
): Promise<{
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  labels: string[];
  attachments: Array<{ id: number; filename: string; mimeType: string; size: number }>;
}> {
  const gmail = getGmailClient(client);

  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const payload = response.data.payload!;
    const headers = payload.headers;

    // Extract body: prefer HTML, fall back to plain text
    let body = findBodyPart(payload, 'text/html');
    if (!body) {
      body = findBodyPart(payload, 'text/plain');
    }
    if (!body && payload.body?.data) {
      body = decodeBase64Url(payload.body.data);
    }

    const attachments = extractAttachments(payload);

    return {
      id: response.data.id!,
      threadId: response.data.threadId!,
      from: getHeader(headers, 'From'),
      to: getHeader(headers, 'To'),
      subject: getHeader(headers, 'Subject'),
      body: body || '',
      date: getHeader(headers, 'Date'),
      labels: response.data.labelIds || [],
      attachments,
    };
  } catch (error: any) {
    throw new BadGatewayError(
      `Gmail API error: ${error.message || 'Failed to get message'}`,
    );
  }
}

export async function sendMessage(
  client: OAuth2Client,
  options: SendMessageOptions,
): Promise<{ messageId: string; threadId: string }> {
  const gmail = getGmailClient(client);

  // Use nodemailer to build RFC 2822 MIME message (handles attachments properly)
  const transporter = nodemailer.createTransport({ streamTransport: true });

  const mailOptions: any = {
    to: options.to,
    subject: options.subject,
    html: options.body,
  };
  if (options.cc) mailOptions.cc = options.cc;
  if (options.bcc) mailOptions.bcc = options.bcc;
  if (options.inReplyTo) mailOptions.inReplyTo = options.inReplyTo;
  if (options.references) mailOptions.references = options.references;
  if (options.attachments && options.attachments.length > 0) {
    mailOptions.attachments = options.attachments.map(a => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    }));
  }

  const info = await transporter.sendMail(mailOptions);

  // Get the raw message as buffer from the stream
  const chunks: Buffer[] = [];
  for await (const chunk of info.message) {
    chunks.push(chunk);
  }
  const rawMessage = Buffer.concat(chunks).toString('base64url');

  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage },
    });
    return {
      messageId: response.data.id!,
      threadId: response.data.threadId!,
    };
  } catch (error: any) {
    throw new BadGatewayError(
      `Gmail API error: ${error.message || 'Failed to send message'}`,
    );
  }
}

export async function trashMessage(
  client: OAuth2Client,
  messageId: string,
): Promise<void> {
  const gmail = getGmailClient(client);

  try {
    await gmail.users.messages.trash({
      userId: 'me',
      id: messageId,
    });
  } catch (error: any) {
    throw new BadGatewayError(
      `Gmail API error: ${error.message || 'Failed to trash message'}`,
    );
  }
}
