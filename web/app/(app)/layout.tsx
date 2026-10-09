'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, info, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!info?.company) router.replace('/empresa');
  }, [loading, user, info, router]);

  if (loading || !user || !info?.company) return <p className="p-8">Carregando...</p>;

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-hawk-border/50 bg-hawk-surface px-6 py-3">
        <b>HAWK · {info.company.name}</b>
        <button onClick={logout} className="text-sm text-hawk-muted hover:text-hawk-text">
          Sair ({user.name})
        </button>
      </header>
      <div className="p-6">{children}</div>
    </div>
  );
}