import { ImapFlow } from 'imapflow';
import { EmailAccount } from '../models';
import { encrypt } from '../utils/encryption';
import { NotFoundError, ForbiddenError, BadGatewayError } from '../utils/errors';
import { enqueueFullSync, scheduleRecurringSync, removeRecurringSync } from '../queues/email-sync.queue';

interface AddImapAccountData {
  email: string;
  displayName?: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  useTls?: boolean;
}

export async function listAccounts(userId: number) {
  const accounts = await EmailAccount.findAll({
    where: { userId },
    attributes: ['id', 'provider', 'email', 'displayName', 'isActive', 'syncStatus', 'lastSyncAt'],
    order: [['createdAt', 'ASC']],
  });
  return accounts;
}

export async function addImapAccount(userId: number, data: AddImapAccountData) {
  const useTls = data.useTls !== false;

  // 1. Test IMAP connection with plain text credentials before saving
  let testClient;
  try {
    testClient = new ImapFlow({
      host: data.imapHost,
      port: data.imapPort,
      secure: useTls,
      auth: { user: data.username, pass: data.password },
      logger: false,
      tls: { rejectUnauthorized: false },
    });
    await testClient.connect();
  } catch (err: any) {
    throw new BadGatewayError(`Failed to connect to IMAP server: ${err.message}`);
  } finally {
    if (testClient) {
      try {
        await testClient.logout();
      } catch {
        // ignore logout errors
      }
    }
  }

  // 2. Encrypt credentials for storage
  const encryptedUser = encrypt(data.username);
  const encryptedPassword = encrypt(data.password);

  // 3. Create EmailAccount record
  const account = await EmailAccount.create({
    userId,
    provider: 'imap',
    email: data.email,
    displayName: data.displayName || null,
    isActive: true,
    imapHost: data.imapHost,
    imapPort: data.imapPort,
    smtpHost: data.smtpHost,
    smtpPort: data.smtpPort,
    imapUser: encryptedUser,
    imapPassword: encryptedPassword,
    useTls,
    syncStatus: 'idle',
  });

  // 3. Enqueue full sync job and schedule recurring sync
  await enqueueFullSync(account.id);
  await scheduleRecurringSync(account.id);

  return account;
}

export async function removeAccount(userId: number, accountId: number) {
  const account = await EmailAccount.findOne({ where: { id: accountId, userId } });
  if (!account) throw new NotFoundError('Account not found');

  // Remove recurring sync job
  await removeRecurringSync(accountId);

  // Delete account (cascade deletes emails + attachments)
  await account.destroy();

  return { message: 'Account removed successfully' };
}

// Helper to get and verify account belongs to user
export async function getAccountForUser(userId: number, accountId: number): Promise<EmailAccount> {
  const account = await EmailAccount.findOne({ where: { id: accountId, userId } });
  if (!account) throw new NotFoundError('Account not found');
  if (!account.isActive) throw new ForbiddenError('Account is inactive');
  return account;
}
