import nodemailer from 'nodemailer';
import { decrypt } from '../../utils/encryption';
import { NotFoundError } from '../../utils/errors';
import EmailAccount from '../../models/EmailAccount';
import Email from '../../models/Email';
import EmailAttachment from '../../models/EmailAttachment';
import { EmailListDTO, EmailDetailDTO, SendMessageOptions } from '../email.interface';
import { createImapClient } from './client';

export async function listMessagesFromDb(
  accountId: number,
  page: number = 1,
  maxResults: number = 20,
): Promise<EmailListDTO> {
  const offset = (page - 1) * maxResults;

  const results = await Email.findAll({
    where: { accountId, isTrashed: false },
    order: [['date', 'DESC']],
    offset,
    limit: maxResults + 1,
  });

  const hasNextPage = results.length > maxResults;
  const emails = results.slice(0, maxResults);

  const nextPageToken = hasNextPage ? String(page + 1) : null;

  const resultSizeEstimate = await Email.count({ where: { accountId, isTrashed: false } });

  return {
    emails: emails.map((email) => ({
      id: String(email.id),
      threadId: email.threadId || '',
      from: email.fromAddress,
      subject: email.subject || '',
      snippet: email.snippet || '',
      date: email.date.toISOString(),
      isRead: email.isRead,
    })),
    nextPageToken,
    resultSizeEstimate,
  };
}

export async function getMessageFromDb(
  accountId: number,
  emailId: string,
): Promise<EmailDetailDTO> {
  const email = await Email.findOne({
    where: { id: parseInt(emailId, 10), accountId },
    include: [{ model: EmailAttachment, as: 'attachments' }],
  });

  if (!email) {
    throw new NotFoundError('Email not found');
  }

  const attachments = (email as any).attachments || [];

  return {
    id: String(email.id),
    threadId: email.threadId || '',
    from: email.fromAddress,
    to: email.toAddress || '',
    subject: email.subject || '',
    body: email.bodyHtml || email.bodyText || '',
    date: email.date.toISOString(),
    labels: email.labels || [],
    attachments: attachments.map((att: EmailAttachment) => ({
      filename: att.filename,
      mimeType: att.mimeType,
      size: att.size,
    })),
  };
}

export async function sendMessageSmtp(
  account: EmailAccount,
  options: SendMessageOptions,
): Promise<{ messageId: string; threadId: string }> {
  const transporter = nodemailer.createTransport({
    host: account.smtpHost!,
    port: account.smtpPort!,
    secure: account.smtpPort === 465,
    auth: {
      user: decrypt(account.imapUser!),
      pass: decrypt(account.imapPassword!),
    },
    tls: { rejectUnauthorized: false },
  });

  const info = await transporter.sendMail({
    from: account.email,
    to: options.to,
    cc: options.cc || undefined,
    bcc: options.bcc || undefined,
    subject: options.subject,
    html: options.body,
    inReplyTo: options.inReplyTo || undefined,
    references: options.references || undefined,
    attachments: options.attachments?.map(a => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })) || undefined,
  });

  return {
    messageId: info.messageId || '',
    threadId: '',
  };
}

export async function trashMessageImap(
  account: EmailAccount,
  emailId: string,
): Promise<void> {
  const email = await Email.findOne({
    where: { id: parseInt(emailId, 10), accountId: account.id },
  });

  if (!email) {
    throw new NotFoundError('Email not found');
  }

  const client = await createImapClient(account);

  try {
    const lock = await client.getMailboxLock('INBOX');

    try {
      await client.messageDelete(email.messageUid, { uid: true });
    } finally {
      lock.release();
    }

    await email.update({ isTrashed: true, trashedAt: new Date() });
  } finally {
    await client.logout();
  }
}

export async function listTrashedFromDb(
  accountId: number,
  page: number = 1,
  maxResults: number = 20,
): Promise<EmailListDTO> {
  const offset = (page - 1) * maxResults;

  const results = await Email.findAll({
    where: { accountId, isTrashed: true },
    order: [['trashedAt', 'DESC']],
    offset,
    limit: maxResults + 1,
  });

  const hasNextPage = results.length > maxResults;
  const emails = results.slice(0, maxResults);

  const nextPageToken = hasNextPage ? String(page + 1) : null;

  const resultSizeEstimate = await Email.count({ where: { accountId, isTrashed: true } });

  return {
    emails: emails.map((email) => ({
      id: String(email.id),
      threadId: email.threadId || '',
      from: email.fromAddress,
      subject: email.subject || '',
      snippet: email.snippet || '',
      date: email.date.toISOString(),
      isRead: email.isRead,
    })),
    nextPageToken,
    resultSizeEstimate,
  };
}

export async function permanentDeleteFromDb(
  accountId: number,
  emailId: string,
): Promise<void> {
  const email = await Email.findOne({
    where: { id: parseInt(emailId, 10), accountId, isTrashed: true },
  });

  if (!email) {
    throw new NotFoundError('Email not found');
  }

  await email.destroy();
}

export async function restoreFromTrash(
  accountId: number,
  emailId: string,
): Promise<void> {
  const email = await Email.findOne({
    where: { id: parseInt(emailId, 10), accountId, isTrashed: true },
  });

  if (!email) {
    throw new NotFoundError('Email not found');
  }

  await email.update({ isTrashed: false, trashedAt: null });
}

export async function markEmailAsRead(accountId: number, emailId: string): Promise<void> {
  const email = await Email.findOne({ where: { id: parseInt(emailId, 10), accountId } });
  if (!email) throw new NotFoundError('Email not found');
  if (!email.isRead) {
    await email.update({ isRead: true });
  }
}
