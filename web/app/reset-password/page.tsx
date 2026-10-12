'use client';

import { ArrowLeft, KeyRound, Lock } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, buttonClasses } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { TextField } from '@/components/ui/TextField';
import { ApiError, api } from '@/lib/api';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const token = new URLSearchParams(window.location.search).get('token') ?? '';
    const nextErrors: typeof fieldErrors = {};
    if (password.length < 8) nextErrors.password = 'A senha deve ter pelo menos 8 caracteres';
    else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      nextErrors.password = 'A senha deve conter letras e números';
    }
    if (confirm !== password) nextErrors.confirm = 'As senhas não conferem';
    setFieldErrors(nextErrors);
    setErrors([]);
    if (Object.keys(nextErrors).length) return;
    if (!token) {
      setErrors(['Link de recuperação inválido ou sem token']);
      return;
    }

    setLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
      });
      setSuccess(true);
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : ['Erro inesperado']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      icon={KeyRound}
      title="Criar nova senha"
      subtitle="Escolha uma senha com pelo menos 8 caracteres, incluindo letras e números"
    >
      {success ? (
        <div className="space-y-4">
          <p className="text-center text-sm text-hawk-muted" role="status">
            Sua senha foi redefinida. Você já pode entrar com a nova senha.
          </p>
          <Link href="/login" className={buttonClasses('primary')}>
            <ArrowLeft size={18} aria-hidden /> Ir para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormAlert messages={errors} />
          <TextField
            label="Nova senha"
            name="password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Digite a nova senha"
            value={password}
            error={fieldErrors.password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <TextField
            label="Confirmar nova senha"
            name="confirm"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Confirme a nova senha"
            value={confirm}
            error={fieldErrors.confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
          <Button type="submit" icon={KeyRound} loading={loading}>
            Redefinir senha
          </Button>
          <Link href="/login" className={buttonClasses('outline')}>
            <ArrowLeft size={18} aria-hidden /> Voltar para o login
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
