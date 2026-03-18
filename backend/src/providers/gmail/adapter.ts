import { OAuth2Client } from 'google-auth-library';
import { createOAuth2Client } from '../../config/google';
import { decrypt, encrypt } from '../../utils/encryption';
import { ForbiddenError } from '../../utils/errors';
import EmailAccount from '../../models/EmailAccount';
import { google } from 'googleapis';
import {
  IEmailProvider,
  EmailListDTO,
  EmailDetailDTO,
  SendMessageOptions,
  AttachmentContentDTO,
} from '../email.interface';
import {
  listMessages,
  getMessage,
  sendMessage,
  trashMessage,
} from './messages';

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export class GmailAdapter implements IEmailProvider {
  private account: EmailAccount;
  private oauth2Client: OAuth2Client;

  constructor(account: EmailAccount) {
    this.account = account;
    this.oauth2Client = createOAuth2Client();

    const accessToken = decrypt(account.accessToken!);
    const refreshToken = decrypt(account.refreshToken!);

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: account.tokenExpiresAt
        ? account.tokenExpiresAt.getTime()
        : undefined,
    });
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.account.tokenExpiresAt) return;

    const now = Date.now();
    const expiresAt = this.account.tokenExpiresAt.getTime();

    if (expiresAt - now < TOKEN_EXPIRY_BUFFER_MS) {
      try {
        const { credentials } =
          await this.oauth2Client.refreshAccessToken();

        const newAccessToken = credentials.access_token!;
        const newExpiresAt = new Date(credentials.expiry_date!);

        await this.account.update({
          accessToken: encrypt(newAccessToken),
          tokenExpiresAt: newExpiresAt,
        });

        this.oauth2Client.setCredentials(credentials);
      } catch (error: any) {
        if (error?.response?.data?.error === 'invalid_grant') {
          throw new ForbiddenError('GMAIL_REAUTH_REQUIRED');
        }
        throw error;
      }
    }
  }

  async listMessages(
    pageToken?: string,
    maxResults?: number,
  ): Promise<EmailListDTO> {
    await this.ensureValidToken();
    return listMessages(this.oauth2Client, pageToken, maxResults);
  }

  async getMessage(messageId: string): Promise<EmailDetailDTO> {
    await this.ensureValidToken();
    return getMessage(this.oauth2Client, messageId);
  }

  async sendMessage(
    options: SendMessageOptions,
  ): Promise<{ messageId: string; threadId: string }> {
    await this.ensureValidToken();
    return sendMessage(this.oauth2Client, options);
  }

  async trashMessage(messageId: string): Promise<void> {
    await this.ensureValidToken();
    return trashMessage(this.oauth2Client, messageId);
  }

  async getAttachment(messageId: string, attachmentId: string): Promise<AttachmentContentDTO> {
    await this.ensureValidToken();
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    // Get the message to find attachment parts
    const msgRes = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    // Collect all attachment parts
    const allAttachments: { gmailAttId: string; filename: string; mimeType: string }[] = [];
    const collectAttachments = (parts: any[]) => {
      for (const part of parts) {
        if (part.body?.attachmentId && part.filename) {
          allAttachments.push({
            gmailAttId: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType || 'application/octet-stream',
          });
        }
        if (part.parts) collectAttachments(part.parts);
      }
    };
    collectAttachments(msgRes.data.payload?.parts || []);

    // Find attachment by index (attachmentId is the index from extractAttachments)
    const idx = parseInt(attachmentId, 10);
    const att = allAttachments[idx];
    if (!att) throw new Error('Attachment not found');

    const attRes = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: att.gmailAttId,
    });

    const data = attRes.data.data;
    if (!data) throw new Error('Attachment data not found');

    return {
      content: Buffer.from(data, 'base64url'),
      mimeType: att.mimeType,
      filename: att.filename,
    };
  }
}
