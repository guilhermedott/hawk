import type { LucideIcon } from 'lucide-react';

type Variant = 'primary' | 'outline';

export const buttonClasses = (variant: Variant = 'primary') =>
  `flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition
   disabled:cursor-not-allowed disabled:opacity-60 ${
     variant === 'primary'
       ? 'bg-hawk-primary text-white shadow-[0_0_20px_rgba(10,108,245,0.35)] hover:bg-hawk-primary-hover'
       : 'border border-hawk-border bg-transparent text-hawk-accent hover:bg-hawk-field'
   }`;

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
};

export function Button({ variant = 'primary', icon: Icon, loading, children, ...props }: Props) {
  return (
    <button {...props} disabled={loading || props.disabled} className={buttonClasses(variant)}>
      {Icon && !loading && <Icon size={18} aria-hidden />}
      {loading ? 'Aguarde...' : children}
    </button>
  );
}