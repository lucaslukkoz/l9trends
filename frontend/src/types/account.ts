export interface EmailAccount {
  id: number;
  provider: 'gmail' | 'imap';
  email: string;
  displayName: string | null;
  isActive: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncAt: string | null;
}

export interface AddImapAccountData {
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
