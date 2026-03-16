import { Queue } from 'bullmq';
import { env } from '../config/env';

const connection = { host: env.REDIS_HOST, port: Number(env.REDIS_PORT) };

export const emailSyncQueue = new Queue('email-sync', { connection });

// Enqueue a one-time incremental sync for an IMAP account
export async function enqueueSync(accountId: number): Promise<void> {
  await emailSyncQueue.add('imap-sync', { accountId }, {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

// Enqueue a full sync (used on first connect)
export async function enqueueFullSync(accountId: number): Promise<void> {
  await emailSyncQueue.add('imap-full-sync', { accountId }, {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
  });
}

// Schedule a repeating sync job for an IMAP account (every 5 minutes)
export async function scheduleRecurringSync(accountId: number, intervalMs: number = 300000): Promise<void> {
  const jobId = `recurring-sync-${accountId}`;
  await emailSyncQueue.add('imap-sync', { accountId }, {
    repeat: { every: intervalMs },
    jobId,
    removeOnComplete: 50,
    removeOnFail: 100,
  });
}

// Remove recurring sync job for an account (when account is deleted)
export async function removeRecurringSync(accountId: number): Promise<void> {
  const jobId = `recurring-sync-${accountId}`;
  const repeatableJobs = await emailSyncQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.id === jobId) {
      await emailSyncQueue.removeRepeatableByKey(job.key);
    }
  }
}
