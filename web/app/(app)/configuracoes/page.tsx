'use client';

import { Building2, Clock3, MonitorCog, Moon, Sun, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function ConfiguracoesPage() {
  const { user, info } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setTheme(localStorage.getItem('hawk_theme') === 'light' ? 'light' : 'dark');
      setRefreshInterval(localStorage.getItem('hawk_refresh_interval') ?? '30');
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  function savePreferences() {
    localStorage.setItem('hawk_theme', theme);
    localStorage.setItem('hawk_refresh_interval', refreshInterval);
    window.dispatchEvent(new CustomEvent('hawk:theme-change', { detail: theme }));
    window.dispatchEvent(new CustomEvent('hawk:refresh-interval', { detail: Number(refreshInterval) }));
    setSaved(true);
  }

  return (
    <div className="data-page settings-page">
      <section className="settings-section">
        <div className="settings-section-heading"><span className="page-stat-icon blue"><MonitorCog size={17} /></span><div><h2>Preferências do painel</h2><p>Estas preferências são salvas neste navegador.</p></div></div>
        <div className="settings-option">
          <div className="settings-option-copy"><strong>Aparência</strong><span>Escolha o tema usado na interface.</span></div>
          <div className="theme-options" role="group" aria-label="Tema do painel">
            <button className={theme === 'dark' ? 'selected' : ''} onClick={() => { setTheme('dark'); setSaved(false); }}><Moon size={14} /> Escuro</button>
            <button className={theme === 'light' ? 'selected' : ''} onClick={() => { setTheme('light'); setSaved(false); }}><Sun size={14} /> Claro</button>
          </div>
        </div>
        <div className="settings-option">
          <div className="settings-option-copy"><strong>Atualização automática</strong><span>Intervalo usado para atualizar dados das telas.</span></div>
          <label className="settings-select-label"><Clock3 size={15} /><select className="data-select" value={refreshInterval} onChange={(event) => { setRefreshInterval(event.target.value); setSaved(false); }}><option value="15">A cada 15 segundos</option><option value="30">A cada 30 segundos</option><option value="60">A cada 60 segundos</option></select></label>
        </div>
        <div className="settings-actions">
          {saved && <span className="settings-saved" role="status">Preferências salvas.</span>}
          <button className="text-action" onClick={savePreferences}>Salvar preferências</button>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading"><span className="page-stat-icon purple"><Building2 size={17} /></span><div><h2>Empresa</h2><p>Informações da empresa associada à sua conta.</p></div></div>
        <div className="settings-info-grid"><div><span>Empresa</span><strong>{info?.company?.name ?? '—'}</strong></div><div><span>Seu perfil</span><strong>{info?.role === 'owner' ? 'Administrador' : 'Membro'}</strong></div></div>
      </section>

      <section className="settings-section">
        <div className="settings-section-heading"><span className="page-stat-icon orange"><UserRound size={17} /></span><div><h2>Conta</h2><p>Dados da sessão atualmente autenticada.</p></div></div>
        <div className="settings-info-grid"><div><span>Nome</span><strong>{user?.name ?? '—'}</strong></div><div><span>E-mail</span><strong>{user?.email ?? '—'}</strong></div></div>
      </section>
      <p className="settings-footnote">Dados de empresa e conta são somente leitura. Para alterá-los, é necessário suporte da API.</p>
    </div>
  );
}
