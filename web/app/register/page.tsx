'use client';

import { ArrowLeft, Calendar, Lock, Mail, User, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button, buttonClasses } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { TextField } from '@/components/ui/TextField';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const empty = { name: '', surname: '', birthDate: '', email: '', password: '', confirm: '' };
type Form = typeof empty;

function validate(f: Form, accepted: boolean) {
  const e: Partial<Record<keyof Form | 'terms', string>> = {};
  if (f.name.trim().length < 2) e.name = 'Informe seu nome';
  if (f.surname.trim().length < 2) e.surname = 'Informe seu sobrenome';
  if (!f.birthDate) e.birthDate = 'Informe a data de nascimento';
  else if (new Date(f.birthDate) > new Date()) e.birthDate = 'A data não pode ser futura';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Informe um e-mail válido';
  if (f.password.length < 8) e.password = 'A senha deve ter pelo menos 8 caracteres';
  if (f.confirm !== f.password) e.confirm = 'As senhas não conferem';
  if (!accepted) e.terms = 'Aceite as políticas e os termos para continuar';
  return e;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<Form>(empty);
  const [accepted, setAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validate>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const bind = (k: keyof Form) => ({
    name: k,
    value: form[k],
    error: fieldErrors[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fe = validate(form, accepted);
    setFieldErrors(fe);
    setErrors([]);
    if (Object.keys(fe).length) return;

    setLoading(true);
    try {
      // o back só recebe name, email e password; a data de nascimento fica só no front por enquanto
      await register(`${form.name.trim()} ${form.surname.trim()}`, form.email.trim(), form.password);
      router.replace('/empresa'); // criar ou entrar em uma empresa
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : ['Erro inesperado']);
      setLoading(false);
    }
  }

  return (
    <AuthShell icon={UserPlus} title="Criar conta" subtitle="Preencha os dados abaixo para criar sua conta">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormAlert messages={errors} />
        <TextField label="Nome" icon={User} placeholder="Digite seu nome" autoComplete="given-name" {...bind('name')} />
        <TextField label="Sobrenome" icon={User} placeholder="Digite seu sobrenome" autoComplete="family-name" {...bind('surname')} />
        <TextField label="Data de nascimento" type="date" icon={Calendar} autoComplete="bday" {...bind('birthDate')} />
        <TextField label="Email" type="email" icon={Mail} placeholder="Digite seu e-mail" autoComplete="email" {...bind('email')} />
        <TextField label="Senha" type="password" icon={Lock} placeholder="Digite sua senha" autoComplete="new-password" {...bind('password')} />
        <TextField label="Confirmar senha" type="password" icon={Lock} placeholder="Confirme sua senha" autoComplete="new-password" {...bind('confirm')} />

        <div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}
              className="h-4 w-4 accent-hawk-primary"
            />
            <span>
              Eu concordo com as <b className="text-hawk-accent">Políticas de Privacidade</b> e{' '}
              <b className="text-hawk-accent">Termos de Uso</b>
            </span>
          </label>
          {fieldErrors.terms && <p className="mt-1 text-xs text-hawk-danger">{fieldErrors.terms}</p>}
        </div>

        <Button type="submit" icon={UserPlus} loading={loading}>Criar conta</Button>

        <div className="flex items-center gap-3 text-xs text-hawk-muted">
          <span className="h-px flex-1 bg-hawk-border/60" />ou<span className="h-px flex-1 bg-hawk-border/60" />
        </div>

        <Link href="/login" className={buttonClasses('outline')}>
          <ArrowLeft size={18} aria-hidden /> Voltar para o login
        </Link>
      </form>
    </AuthShell>
  );
}