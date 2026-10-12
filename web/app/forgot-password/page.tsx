'use client';

import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, buttonClasses } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { TextField } from '@/components/ui/TextField';
import { ApiError, api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrors([]);
    setError('');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Informe um e-mail válido');
      return;
    }

    setLoading(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim() },
      });
      setSent(true);
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : ['Erro inesperado']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      icon={KeyRound}
      title="Recuperar senha"
      subtitle="Informe seu e-mail para receber um link de redefinição"
    >
      {sent ? (
        <div className="space-y-4">
          <p className="text-center text-sm text-hawk-muted" role="status">
            Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.
          </p>
          <Link href="/login" className={buttonClasses('outline')}>
            <ArrowLeft size={18} aria-hidden /> Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormAlert messages={errors} />
          <TextField
            label="E-mail"
            name="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="Digite seu e-mail"
            value={email}
            error={error}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" icon={KeyRound} loading={loading}>
            Enviar link
          </Button>
          <Link href="/login" className={buttonClasses('outline')}>
            <ArrowLeft size={18} aria-hidden /> Voltar para o login
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
