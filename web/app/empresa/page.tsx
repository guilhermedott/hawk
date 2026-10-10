'use client';

import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { TextField } from '@/components/ui/TextField';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function EmpresaPage() {
  const { user, info, loading, refresh, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (info?.company) router.replace('/dashboard');
  }, [loading, user, info, router]);

  // aguardando aprovação: consulta a API de tempos em tempos
  useEffect(() => {
    if (!info?.pendingRequest) return;
    const t = setInterval(() => refresh().catch(() => {}), 10_000);
    return () => clearInterval(t);
  }, [info?.pendingRequest, refresh]);

  async function run(fn: () => Promise<unknown>) {
    setErrors([]);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : ['Erro inesperado']);
    }
  }

  if (loading || !info) return <p className="p-8">Carregando...</p>;

  const pending = info.pendingRequest;

  return (
    <AuthShell
      icon={Building2}
      title={pending ? 'Aguardando aprovação' : 'Sua empresa'}
      subtitle={
        pending
          ? `Pedido para entrar em ${pending.companyName}. Esta tela atualiza sozinha.`
          : 'Crie uma empresa ou peça para entrar em uma existente'
      }
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <FormAlert messages={errors} />
        {pending ? (
          <>
            <Button type="button" onClick={() => run(async () => {})}>Verificar agora</Button>
            <Button
              type="button" variant="outline"
              onClick={() => run(() => api('/companies/join-requests/mine', { method: 'DELETE' }))}
            >
              Cancelar pedido
            </Button>
          </>
        ) : (
          <>
            <TextField
              label="Nome da empresa" name="company" icon={Building2}
              placeholder="Digite o nome da empresa" value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="button" onClick={() => run(() => api('/companies', { method: 'POST', body: { name } }))}>
              Criar empresa
            </Button>
            <Button
              type="button" variant="outline"
              onClick={() => run(() => api('/companies/join-requests', { method: 'POST', body: { companyName: name } }))}
            >
              Pedir para entrar
            </Button>
          </>
        )}
        <button type="button" onClick={logout} className="w-full text-sm text-hawk-muted underline">
          Sair
        </button>
      </div>
    </AuthShell>
  );
}