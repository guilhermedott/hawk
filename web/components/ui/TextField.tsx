'use client';

import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { forwardRef, useState } from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
  error?: string;
};

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, icon: Icon, error, type = 'text', id, className = '', ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputId = id ?? props.name;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-hawk-accent">
        {label}
      </label>
      <div
        className={`flex items-center gap-3 rounded-lg border bg-hawk-field px-3 focus-within:ring-2
          focus-within:ring-hawk-accent/50 ${error ? 'border-hawk-danger' : 'border-hawk-border/60'}`}
      >
        <Icon size={18} className="shrink-0 text-hawk-muted" aria-hidden />
        <input
          ref={ref}
          id={inputId}
          type={isPassword && show ? 'text' : type}
          aria-invalid={!!error}
          {...props}
          className={`h-11 w-full bg-transparent text-sm text-hawk-text outline-none
            placeholder:text-hawk-muted/70 [color-scheme:dark] ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            className="text-hawk-muted hover:text-hawk-text"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-hawk-danger">{error}</p>}
    </div>
  );
});