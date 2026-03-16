import { ImapFlow } from 'imapflow';
import { decrypt } from '../../utils/encryption';
import EmailAccount from '../../models/EmailAccount';

export async function createImapClient(
  account: EmailAccount,
): Promise<ImapFlow> {
  const password = decrypt(account.imapPassword!);
  const user = decrypt(account.imapUser!);

  const client = new ImapFlow({
    host: account.imapHost!,
    port: account.imapPort!,
    secure: account.useTls,
    auth: { user, pass: password },
    logger: false,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 30000,
  });

  await client.connect();
  return client;
}
