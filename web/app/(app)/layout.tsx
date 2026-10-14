'use client';

import {
  Activity,
  Bell,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Package,
  Settings,
  Sun,
  ChartNoAxesCombined,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', count: '' },
  { label: 'Monitoramentos', icon: Monitor, href: '/monitoramentos', count: '' },
  { label: 'Alertas', icon: Bell, href: '/alertas', count: '' },
  { label: 'Chamados', icon: ClipboardList, href: '/chamados', count: '' },
  { label: 'Inventário', icon: Package, href: '/inventario', count: '' },
  { label: 'Relatórios', icon: ChartNoAxesCombined, href: '/relatorios', count: '' },
  { label: 'Configurações', icon: Settings, href: '/configuracoes', count: '' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, info, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [lightMode, setLightMode] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!info?.company) router.replace('/empresa');
  }, [loading, user, info, router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLightMode(localStorage.getItem('hawk_theme') === 'light');
      setRefreshInterval(localStorage.getItem('hawk_refresh_interval') ?? '30');
      setPreferencesLoaded(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const theme = (event as CustomEvent<'dark' | 'light'>).detail;
      if (theme === 'dark' || theme === 'light') setLightMode(theme === 'light');
    };
    window.addEventListener('hawk:theme-change', handleThemeChange);
    return () => window.removeEventListener('hawk:theme-change', handleThemeChange);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    document.documentElement.dataset.theme = lightMode ? 'light' : 'dark';
    localStorage.setItem('hawk_theme', lightMode ? 'light' : 'dark');
    window.dispatchEvent(new CustomEvent('hawk:theme', { detail: lightMode ? 'light' : 'dark' }));
  }, [lightMode, preferencesLoaded]);

  if (loading || !user || !info?.company) return <p className="p-8">Carregando...</p>;

  const pageDetails: Record<string, { title: string; subtitle: string }> = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Visão geral do ambiente' },
    '/monitoramentos': { title: 'Monitoramentos', subtitle: 'Acompanhe a saúde e os recursos dos ativos' },
    '/alertas': { title: 'Alertas', subtitle: 'Condições que precisam de atenção' },
    '/chamados': { title: 'Chamados', subtitle: 'Gerencie solicitações de suporte' },
    '/inventario': { title: 'Inventário', subtitle: 'Ativos cadastrados na empresa' },
    '/relatorios': { title: 'Relatórios', subtitle: 'Consulte e exporte dados do ambiente' },
    '/configuracoes': { title: 'Configurações', subtitle: 'Preferências da aplicação e da empresa' },
  };
  const page = pageDetails[pathname] ?? pageDetails['/dashboard'];
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`app-shell${lightMode ? ' light-mode' : ''}`}>
      <aside className="sidebar">
        <Link className="brand" href="/dashboard" aria-label="HAWK Dashboard">
          <span className="brand-mark"><Activity size={19} strokeWidth={2.6} /></span>
          <span className="brand-name">HAWK<span>.</span></span>
        </Link>

        <div className="sidebar-label">MENU PRINCIPAL</div>
        <nav className="side-nav" aria-label="Navegação principal">
          {navigation.map(({ label, icon: Icon, href }) => (
            <Link key={label} href={href} className={`nav-link${pathname === href ? ' active' : ''}`}>
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-label">SUPORTE</div>
          <a className="nav-link" href="mailto:suporte@hawk.local">
            <CircleHelp size={17} strokeWidth={1.8} /><span>Ajuda</span>
          </a>
          <button className="nav-link logout-link" onClick={logout}>
            <LogOut size={17} strokeWidth={1.8} /><span>Sair</span>
          </button>
          <div className="profile-card">
            <span className="avatar">
              {user.avatarDataUrl
                ? <Image src={user.avatarDataUrl} alt={`Foto de ${user.name}`} width={33} height={33} unoptimized />
                : initials || 'AW'}
            </span>
            <span className="profile-copy">
              <strong>{user.name}</strong>
              <small>{info.role === 'owner' ? 'Administrator' : 'Membro'}</small>
            </span>
            <ChevronDown size={15} className="profile-chevron" />
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="page-heading">
            <div className="breadcrumbs">{info.company.name}<span>/</span> {page.title}</div>
            <h1>{page.title}</h1>
            <p>{page.subtitle}</p>
          </div>
          <div className="topbar-actions">
            <button className="date-control" aria-label="Dados atuais do ambiente">
              <span className="calendar-icon">▦</span>
              <span>Visão atual</span>
            </button>
            <label className="refresh-control">
              <span className="refresh-dot" />
              <select
                aria-label="Intervalo de atualização"
                value={refreshInterval}
                onChange={(event) => {
                  setRefreshInterval(event.target.value);
                  localStorage.setItem('hawk_refresh_interval', event.target.value);
                  window.dispatchEvent(
                    new CustomEvent('hawk:refresh-interval', { detail: Number(event.target.value) }),
                  );
                }}
              >
                <option value="15">Atualização: 15s</option>
                <option value="30">Atualização: 30s</option>
                <option value="60">Atualização: 60s</option>
              </select>
              <ChevronDown size={14} />
            </label>
            <button
              className={`theme-toggle${lightMode ? ' is-light' : ''}`}
              onClick={() => setLightMode((value) => !value)}
              aria-label={lightMode ? 'Ativar tema escuro' : 'Ativar tema claro'}
              aria-pressed={lightMode}
            >
              <span>{lightMode ? <Sun size={13} /> : <Moon size={13} />}</span>
            </button>
          </div>
        </header>
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
