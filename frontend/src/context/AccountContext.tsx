'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EmailAccount } from '@/types/account';
import { useAuth } from '@/hooks/useAuth';

interface AccountContextType {
  accounts: EmailAccount[];
  activeAccountId: number | null;
  setActiveAccountId: (id: number) => void;
  refreshAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.accounts) {
      setAccounts(user.accounts);
      if (!activeAccountId && user.accounts.length > 0) {
        setActiveAccountId(user.accounts[0].id);
      }
    }
  }, [user]);

  const refreshAccounts = async () => {
    const api = (await import('@/lib/api')).default;
    const res = await api.get<{ accounts: EmailAccount[] }>('/accounts');
    const updated = res.data.accounts;
    setAccounts(updated);
    // If active account was removed, switch to first remaining or null
    if (activeAccountId && !updated.find(a => a.id === activeAccountId)) {
      setActiveAccountId(updated.length > 0 ? updated[0].id : null as any);
    }
  };

  return (
    <AccountContext.Provider value={{ accounts, activeAccountId, setActiveAccountId, refreshAccounts }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountContext() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccountContext must be used within AccountProvider');
  return ctx;
}
