import EmailAccount from '../../models/EmailAccount';
import {
  IEmailProvider,
  EmailListDTO,
  EmailDetailDTO,
  SendMessageOptions,
  AttachmentContentDTO,
} from '../email.interface';
import {
  listMessagesFromDb,
  getMessageFromDb,
  sendMessageSmtp,
  trashMessageImap,
  getAttachmentFromImap,
} from './messages';

export class ImapAdapter implements IEmailProvider {
  private account: EmailAccount;

  constructor(account: EmailAccount) {
    this.account = account;
  }

  async listMessages(
    pageToken?: string,
    maxResults?: number,
  ): Promise<EmailListDTO> {
    const page = pageToken ? parseInt(pageToken, 10) : 1;
    return listMessagesFromDb(this.account.id, page, maxResults);
  }

  async getMessage(messageId: string): Promise<EmailDetailDTO> {
    return getMessageFromDb(this.account.id, messageId);
  }

  async sendMessage(
    options: SendMessageOptions,
  ): Promise<{ messageId: string; threadId: string }> {
    return sendMessageSmtp(this.account, options);
  }

  async trashMessage(messageId: string): Promise<void> {
    return trashMessageImap(this.account, messageId);
  }

  async getAttachment(messageId: string, attachmentId: string): Promise<AttachmentContentDTO> {
    return getAttachmentFromImap(this.account, messageId, attachmentId);
  }
}
