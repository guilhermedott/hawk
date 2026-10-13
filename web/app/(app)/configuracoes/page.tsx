'use client';

import { Building2, Clock3, ImagePlus, MonitorCog, Moon, Save, Sun, UserRound, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

export default function ConfiguracoesPage() {
  const { user, info, updateProfile } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [refreshInterval, setRefreshInterval] = useState('30');
  const [saved, setSaved] = useState(false);
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(user?.avatarDataUrl ?? null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

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

  async function handleAvatarChange(file?: File) {
    if (!file) return;
    setProfileError('');
    setProfileSaved(false);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfileError('Selecione uma imagem JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('A imagem deve ter no máximo 5 MB.');
      return;
    }

    try {
      const image = await createImageBitmap(file);
      const scale = Math.min(1, 256 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Não foi possível processar a imagem.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.close();
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      if (dataUrl.length > 300_000) throw new Error('Não foi possível reduzir a imagem para o tamanho permitido.');
      setAvatarDataUrl(dataUrl);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Não foi possível carregar a foto.');
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileSaved(false);
    setProfileError('');
    try {
      await updateProfile(profileName.trim(), avatarDataUrl);
      setProfileName(profileName.trim());
      setProfileSaved(true);
    } catch (error) {
      setProfileError(error instanceof ApiError ? error.messages.join(', ') : 'Não foi possível salvar as alterações do perfil.');
    } finally {
      setSavingProfile(false);
    }
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
        <form className="profile-form" onSubmit={saveProfile}>
          <div className="profile-photo-row">
            <div className="profile-photo-preview" aria-label="Pré-visualização da foto do perfil">
              {avatarDataUrl
                ? <Image src={avatarDataUrl} alt="Foto do perfil" width={64} height={64} unoptimized />
                : <span>{profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'HA'}</span>}
            </div>
            <div className="profile-photo-actions">
              <strong>Foto do perfil</strong>
              <span>JPEG, PNG ou WebP. A imagem será redimensionada para até 256 px.</span>
              <label className="text-action profile-upload">
                <ImagePlus size={14} /> Escolher foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    void handleAvatarChange(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
              </label>
              {avatarDataUrl && (
                <button className="text-action profile-remove-photo" type="button" onClick={() => { setAvatarDataUrl(null); setProfileSaved(false); }}>
                  <X size={14} /> Remover foto
                </button>
              )}
            </div>
          </div>
          <label className="profile-field">
            <span>Nome</span>
            <input value={profileName} maxLength={80} required onChange={(event) => { setProfileName(event.target.value); setProfileSaved(false); }} />
          </label>
          <div className="profile-field">
            <span>E-mail</span>
            <strong>{user?.email ?? '—'}</strong>
          </div>
          {profileError && <p className="profile-error" role="alert">{profileError}</p>}
          <div className="settings-actions">
            {profileSaved && <span className="settings-saved" role="status">Perfil atualizado.</span>}
            <button className="text-action" type="submit" disabled={savingProfile}>
              <Save size={14} /> {savingProfile ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </form>
      </section>
      <p className="settings-footnote">Nome e foto são salvos na sua conta. Preferências do painel permanecem salvas neste navegador.</p>
    </div>
  );
}
