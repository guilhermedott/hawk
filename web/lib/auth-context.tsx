'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from './api';

export type User = { id: string; name: string; email: string };
export type CompanyInfo = {
  company: { id: string; name: string } | null;
  role: 'owner' | 'member' | null;
  pendingRequest: { id: string; companyName: string; createdAt: string } | null;
};

type AuthState = {
  user: User | null;
  info: CompanyInfo | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null);
      setInfo(null);
      return;
    }
    const [me, company] = await Promise.all([
      api<User>('/auth/me'),
      api<CompanyInfo>('/companies/me'),
    ]);
    setUser(me);
    setInfo(company);
  }, []);

  useEffect(() => {
    refresh().catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, [refresh]);

  async function authenticate(path: string, body: object, remember: boolean) {
    const { accessToken } = await api<{ accessToken: string }>(path, { method: 'POST', body });
    tokenStore.set(accessToken, remember);
    await refresh();
  }

  const value: AuthState = {
    user, info, loading, refresh,
    login: (email, password, remember) =>
      authenticate('/auth/login', { email, password }, remember),
    register: (name, email, password) =>
      authenticate('/auth/register', { name, email, password }, true),
    logout: () => {
      tokenStore.clear();
      setUser(null);
      setInfo(null);
      window.location.href = '/login';
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}