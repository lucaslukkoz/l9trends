import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { EmailAccount } from '../models';

// Import syncImapAccount — the actual sync function lives in providers/imap/sync.ts
// It will be created by another agent. For now, import it.
import { syncImapAccount } from '../providers/imap/sync';

const connection = { host: env.REDIS_HOST, port: Number(env.REDIS_PORT) };

const worker = new Worker('email-sync', async (job: Job) => {
  const { accountId } = job.data;

  const account = await EmailAccount.findByPk(accountId);
  if (!account || !account.isActive) {
    console.log(`Skipping sync for account ${accountId}: not found or inactive`);
    return;
  }

  if (account.provider !== 'imap') {
    console.log(`Skipping sync for account ${accountId}: provider is ${account.provider}`);
    return;
  }

  console.log(`Starting ${job.name} for account ${accountId} (${account.email})`);

  await account.update({ syncStatus: 'syncing', syncError: null });

  try {
    await syncImapAccount(account);
    await account.update({
      syncStatus: 'idle',
      lastSyncAt: new Date(),
      syncError: null,
    });
    console.log(`Sync completed for account ${accountId}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await account.update({ syncStatus: 'error', syncError: errorMessage });
    console.error(`Sync failed for account ${accountId}:`, errorMessage);
    throw err; // Re-throw so BullMQ retries
  }
}, {
  connection,
  concurrency: 3,
  limiter: { max: 10, duration: 60000 },
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed for account ${job.data.accountId}`);
});

worker.on('failed', async (job, err) => {
  if (job && job.attemptsMade >= (job.opts?.attempts || 3)) {
    // Final attempt failed — reset to idle so recurring jobs keep trying
    try {
      const account = await EmailAccount.findByPk(job.data.accountId);
      if (account) {
        await account.update({ syncStatus: 'idle' });
      }
    } catch { /* ignore */ }
  }
  console.error(`Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

export default worker;
