import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getEmailProvider } from '../providers/email.factory';
import { SendMessageOptions } from '../providers/email.interface';
import { getAccountForUser } from './account.service';
import { getCachedOrFetch, invalidatePattern, invalidateKey } from './cache.service';
import { enqueueSync } from '../queues/email-sync.queue';
import { listTrashedFromDb, listSentFromDb, permanentDeleteFromDb, restoreFromTrash, markEmailAsRead, listFavoritesFromDb, toggleFavoriteInDb, searchMessagesFromDb } from '../providers/imap/messages';
import Email from '../models/Email';
import EmailAttachment from '../models/EmailAttachment';
import { Draft } from '../models';

export async function getInbox(userId: number, accountId: number, pageToken?: string, maxResults?: number) {
  const account = await getAccountForUser(userId, accountId);
  const provider = getEmailProvider(account);

  const cacheKey = `inbox:${accountId}:${pageToken || 'first'}`;
  return getCachedOrFetch(cacheKey, 120, () => provider.listMessages(pageToken, maxResults));
}

export async function getEmail(userId: number, accountId: number, emailId: string) {
  const account = await getAccountForUser(userId, accountId);
  const provider = getEmailProvider(account);

  const cacheKey = `email:${accountId}:${emailId}`;
  return getCachedOrFetch(cacheKey, 600, () => provider.getMessage(emailId));
}

export async function sendEmail(userId: number, accountId: number, options: SendMessageOptions, draftId?: number) {
  const account = await getAccountForUser(userId, accountId);
  const provider = getEmailProvider(account);

  const result = await provider.sendMessage(options);
  await invalidatePattern(`inbox:${accountId}:*`);

  // Store sent email in database
  const savedEmail = await Email.create({
    accountId: account.id,
    messageUid: result.messageId || `sent-${Date.now()}`,
    threadId: result.threadId || null,
    fromAddress: account.email,
    toAddress: options.to,
    subject: options.subject,
    bodyHtml: options.body,
    snippet: options.body.replace(/<[^>]*>/g, '').substring(0, 200),
    date: new Date(),
    isRead: true,
    folder: 'sent',
    hasAttachments: !!(options.attachments && options.attachments.length > 0),
  });

  // Store attachments to disk and create DB records
  if (options.attachments && options.attachments.length > 0) {
    const attachmentsDir = path.join(process.cwd(), 'uploads', 'attachments');
    fs.mkdirSync(attachmentsDir, { recursive: true });

    await EmailAttachment.bulkCreate(
      options.attachments.map((att) => {
        let filePath: string | null = null;
        if (att.content) {
          const uniqueName = `${savedEmail.id}-${crypto.randomUUID()}-${att.filename}`;
          filePath = path.join(attachmentsDir, uniqueName);
          fs.writeFileSync(filePath, att.content);
        }
        return {
          emailId: savedEmail.id,
          filename: att.filename,
          mimeType: att.contentType || 'application/octet-stream',
          size: att.content ? att.content.length : 0,
          filePath,
        };
      })
    );
  }

  // Delete draft if sent from a draft
  if (draftId) {
    await Draft.destroy({ where: { id: draftId, accountId: account.id } });
  }

  return result;
}

export async function deleteEmail(userId: number, accountId: number, emailId: string) {
  const account = await getAccountForUser(userId, accountId);
  const provider = getEmailProvider(account);

  await provider.trashMessage(emailId);
  await invalidatePattern(`inbox:${accountId}:*`);
  await invalidateKey(`email:${accountId}:${emailId}`);
  return { message: 'Email deleted successfully' };
}

export async function triggerSync(userId: number, accountId: number) {
  const account = await getAccountForUser(userId, accountId);
  if (account.provider !== 'imap') {
    return { message: 'Gmail accounts sync automatically via API' };
  }
  await enqueueSync(accountId);
  return { message: 'Sync job enqueued' };
}

export async function getTrash(userId: number, accountId: number, pageToken?: string) {
  const account = await getAccountForUser(userId, accountId);
  const page = pageToken ? parseInt(pageToken) : 1;
  return listTrashedFromDb(accountId, page);
}

export async function getSentEmails(userId: number, accountId: number, pageToken?: string) {
  const account = await getAccountForUser(userId, accountId);
  const page = pageToken ? parseInt(pageToken) : 1;
  return listSentFromDb(account.id, page);
}

export async function permanentDelete(userId: number, accountId: number, emailId: string) {
  await getAccountForUser(userId, accountId);
  await permanentDeleteFromDb(accountId, emailId);
  return { message: 'E-mail excluído permanentemente' };
}

export async function restoreEmail(userId: number, accountId: number, emailId: string) {
  await getAccountForUser(userId, accountId);
  await restoreFromTrash(accountId, emailId);
  await invalidatePattern(`inbox:${accountId}:*`);
  return { message: 'E-mail restaurado' };
}

export async function markAsRead(userId: number, accountId: number, emailId: string) {
  await getAccountForUser(userId, accountId);
  await markEmailAsRead(accountId, emailId);
  await invalidateKey(`email:${accountId}:${emailId}`);
  return { message: 'Marcado como lido' };
}

export async function getAttachment(userId: number, accountId: number, emailId: string, attachmentId: string) {
  const account = await getAccountForUser(userId, accountId);
  const provider = getEmailProvider(account);
  return provider.getAttachment(emailId, attachmentId);
}

export async function toggleFavorite(userId: number, accountId: number, emailId: string) {
  await getAccountForUser(userId, accountId);
  const isFavorite = await toggleFavoriteInDb(accountId, emailId);
  await invalidatePattern(`inbox:${accountId}:*`);
  await invalidateKey(`email:${accountId}:${emailId}`);
  return { isFavorite };
}

export async function searchEmails(userId: number, accountId: number, query: string, pageToken?: string) {
  const account = await getAccountForUser(userId, accountId);
  const page = pageToken ? parseInt(pageToken) : 1;
  return searchMessagesFromDb(account.id, query, page);
}

export async function getFavorites(userId: number, accountId: number, pageToken?: string) {
  const account = await getAccountForUser(userId, accountId);
  const page = pageToken ? parseInt(pageToken) : 1;
  return listFavoritesFromDb(account.id, page);
}
