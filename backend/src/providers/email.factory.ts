import EmailAccount from '../models/EmailAccount';
import { IEmailProvider } from './email.interface';
import { GmailAdapter } from './gmail/adapter';
import { ImapAdapter } from './imap/adapter';

export function getEmailProvider(account: EmailAccount): IEmailProvider {
  switch (account.provider) {
    case 'gmail':
      return new GmailAdapter(account);
    case 'imap':
      return new ImapAdapter(account);
    default:
      throw new Error(`Unknown provider: ${account.provider}`);
  }
}
