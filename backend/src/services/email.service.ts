import { getEmailProvider } from '../providers/email.factory';
import { SendMessageOptions } from '../providers/email.interface';
import { getAccountForUser } from './account.service';
import { getCachedOrFetch, invalidatePattern, invalidateKey } from './cache.service';
import { enqueueSync } from '../queues/email-sync.queue';
import { listTrashedFromDb, permanentDeleteFromDb, restoreFromTrash, markEmailAsRead } from '../providers/imap/messages';

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

export async function sendEmail(userId: number, accountId: number, options: SendMessageOptions) {
  const account = await getAccountForUser(userId, accountId);
  const provider = getEmailProvider(account);

  const result = await provider.sendMessage(options);
  await invalidatePattern(`inbox:${accountId}:*`);
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
