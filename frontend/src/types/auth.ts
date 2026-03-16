import { EmailAccount } from './account';

export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  gmailConnected: boolean;
  gmailEmail: string | null;
  accounts: EmailAccount[];
}
