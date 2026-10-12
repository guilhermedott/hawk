'use client';

import { LogIn, Lock, ChartLine, User, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, buttonClasses } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { TextField } from '@/components/ui/TextField';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fe: typeof fieldErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) fe.email = 'Informe um e-mail válido';
    if (!password) fe.password = 'Informe a senha';
    setFieldErrors(fe);
    setErrors([]);
    if (Object.keys(fe).length) return;

    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      router.replace('/dashboard');
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : ['Erro inesperado']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell icon={ChartLine} title="Bem-vindo!" subtitle="Faça login para continuar" maxWidth="max-w-xl">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormAlert messages={errors} />
        <TextField
          label="E-mail" name="email" type="email" icon={User} autoComplete="email"
          placeholder="Digite seu e-mail" value={email} error={fieldErrors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Senha" name="password" type="password" icon={Lock} autoComplete="current-password"
          placeholder="Digite sua senha" value={password} error={fieldErrors.password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 accent-hawk-primary"
            />
            Lembrar-me
          </label>
          <Link href="/forgot-password" className="font-semibold text-hawk-accent hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" icon={LogIn} loading={loading}>Login</Button>

        <div className="flex items-center gap-3 text-xs text-hawk-muted">
          <span className="h-px flex-1 bg-hawk-border/60" />ou<span className="h-px flex-1 bg-hawk-border/60" />
        </div>

        <Link href="/register" className={buttonClasses('outline')}>
          <UserPlus size={18} aria-hidden /> Criar conta
        </Link>
      </form>
    </AuthShell>
  );
}