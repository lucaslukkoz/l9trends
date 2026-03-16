import { getAuthenticatedClient } from '../providers/gmail/client';
import {
  listMessages,
  getMessage,
  sendMessage,
  trashMessage,
} from '../providers/gmail/messages';
import {
  getCachedOrFetch,
  invalidatePattern,
  invalidateKey,
} from './cache.service';

export async function getInbox(
  userId: number,
  pageToken?: string,
  maxResults?: number,
) {
  const cacheKey = `inbox:${userId}:${pageToken || 'first'}`;

  return getCachedOrFetch(cacheKey, 120, async () => {
    const client = await getAuthenticatedClient(userId);
    return listMessages(client, pageToken, maxResults);
  });
}

export async function getEmail(userId: number, emailId: string) {
  const cacheKey = `email:${userId}:${emailId}`;

  return getCachedOrFetch(cacheKey, 600, async () => {
    const client = await getAuthenticatedClient(userId);
    return getMessage(client, emailId);
  });
}

export async function sendEmail(
  userId: number,
  to: string,
  subject: string,
  body: string,
) {
  const client = await getAuthenticatedClient(userId);
  const result = await sendMessage(client, to, subject, body);

  // Invalidate inbox cache
  await invalidatePattern(`inbox:${userId}:*`);

  return result;
}

export async function deleteEmail(userId: number, emailId: string) {
  const client = await getAuthenticatedClient(userId);
  await trashMessage(client, emailId);

  // Invalidate inbox cache and specific email cache
  await invalidatePattern(`inbox:${userId}:*`);
  await invalidateKey(`email:${userId}:${emailId}`);
}
