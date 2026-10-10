import type { LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  maxWidth?: string;
  children: React.ReactNode;
};

export function AuthShell({ icon: Icon, title, subtitle, maxWidth = 'max-w-lg', children }: Props) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <header className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hawk-logo.svg" alt="HAWK" className="mx-auto h-14 w-auto" />
        <div className="mt-2 flex items-center gap-3">
          <span className="h-px w-12 bg-hawk-border sm:w-24" />
          <p className="text-base text-hawk-accent">Monitoramento e Gestão de Ativos</p>
          <span className="h-px w-12 bg-hawk-border sm:w-24" />
        </div>
      </header>

      <section
        className={`w-full ${maxWidth} rounded-2xl border border-hawk-border/70 bg-hawk-surface/80 p-6
          shadow-[0_0_40px_rgba(26,140,255,0.15)] sm:p-8`}
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl border border-hawk-accent bg-hawk-field text-hawk-accent">
            <Icon size={28} aria-hidden />
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-hawk-muted">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}