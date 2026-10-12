'use client';

import { Package, Plus, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { DataPageState } from '@/components/dashboard/DataPageState';
import { useDashboardData } from '@/components/dashboard/useDashboardData';
import { api, ApiError } from '@/lib/api';
import { assetStatusLabel, assetTypeLabel, type Asset } from '@/lib/dashboard-types';

type AssetForm = {
  tag: string;
  name: string;
  type: Asset['type'];
  department: string;
  responsible: string;
  notes: string;
};

const blankForm: AssetForm = {
  tag: '',
  name: '',
  type: 'computer',
  department: '',
  responsible: '',
  notes: '',
};

export default function InventarioPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AssetForm>(blankForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const loadData = useCallback(() => api<Asset[]>('/assets'), []);
  const { data, loading, error, reload } = useDashboardData(loadData);
  const assets = useMemo(() => (data ?? []).filter((asset) =>
    `${asset.tag} ${asset.name} ${asset.department} ${asset.responsible} ${asset.ip}`.toLowerCase().includes(query.toLowerCase()),
  ), [data, query]);

  useEffect(() => {
    if (!showForm) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showForm]);

  async function createAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');
    setSuccess('');
    try {
      await api<Asset>('/assets', { method: 'POST', body: form });
      setForm(blankForm);
      setShowForm(false);
      setSuccess('Ativo cadastrado com sucesso.');
      await reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.messages.join(', ') : 'Não foi possível cadastrar o ativo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="data-page">
      <DataPageState loading={loading && !data} error={error && !data ? error : ''} retry={reload} />
      {error && data && <div className="dashboard-refresh-error" role="status">{error}</div>}
      {data && (
        <>
          <section className="page-stat-grid three-stats">
            <article className="page-stat-card"><span className="page-stat-icon blue"><Package size={17} /></span><div><strong>{data.length}</strong><span>Total de ativos</span></div></article>
            <article className="page-stat-card"><span className="page-stat-icon green"><span className="status-dot" /></span><div><strong>{data.filter((asset) => asset.status === 'online').length}</strong><span>Online</span></div></article>
            <article className="page-stat-card"><span className="page-stat-icon red"><span className="status-dot" /></span><div><strong>{data.filter((asset) => asset.status === 'offline').length}</strong><span>Offline</span></div></article>
          </section>
          {success && <div className="success-message" role="status">{success}</div>}
          <section className="panel data-panel">
              <div className="panel-heading">
                <div><h2>Itens do inventário</h2><p>{assets.length} de {data.length} ativos cadastrados</p></div>
                <div className="data-filters">
                  <label className="search-field"><Search size={14} /><input aria-label="Buscar inventário" placeholder="Buscar ativos" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
                  <button className="text-action" onClick={() => { setShowForm(true); setFormError(''); }}><Plus size={14} /> Novo item</button>
                </div>
              </div>
              <div className="data-table-wrap">
                <table className="data-table inventory-table">
                  <thead><tr><th>Tag / Ativo</th><th>Tipo</th><th>Setor</th><th>Responsável</th><th>IP</th><th>Status</th></tr></thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr key={asset.id}>
                        <td><strong>{asset.tag}</strong><span className="table-secondary">{asset.name}</span></td>
                        <td>{assetTypeLabel(asset.type)}</td>
                        <td>{asset.department}</td>
                        <td>{asset.responsible}</td>
                        <td>{asset.ip}</td>
                        <td><span className={`status-badge ${asset.status === 'online' ? 'green' : asset.status === 'offline' ? 'red' : 'purple'}`}>{assetStatusLabel(asset.status)}</span></td>
                      </tr>
                    ))}
                    {assets.length === 0 && <tr><td colSpan={6} className="table-empty">Nenhum ativo encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>
          </section>
        </>
      )}
      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setShowForm(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !submitting) setShowForm(false);
          }}
        >
          <section className="panel asset-modal" role="dialog" aria-modal="true" aria-labelledby="asset-modal-title">
            <div className="panel-heading">
              <div><h2 id="asset-modal-title">Cadastrar ativo</h2><p>Preencha os dados para adicionar ao inventário.</p></div>
              <button className="icon-button" type="button" aria-label="Fechar formulário" disabled={submitting} onClick={() => setShowForm(false)}><X size={17} /></button>
            </div>
            <form className="asset-form" onSubmit={createAsset}>
              {formError && <div className="form-error" role="alert">{formError}</div>}
              <label>Tag do ativo<input autoFocus required minLength={3} maxLength={30} pattern="[A-Za-z0-9-]+" placeholder="Ex.: SRV-001" value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value.toUpperCase() })} /></label>
              <label>Nome do ativo<input required maxLength={60} placeholder="Ex.: Servidor principal" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label>Tipo<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Asset['type'] })}><option value="computer">Computador</option><option value="notebook">Notebook</option><option value="server">Servidor</option><option value="switch">Switch</option></select></label>
              <label>Setor<input required maxLength={60} placeholder="Ex.: Tecnologia" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label>
              <label>Responsável<input required maxLength={60} placeholder="Nome do responsável" value={form.responsible} onChange={(event) => setForm({ ...form, responsible: event.target.value })} /></label>
              <label className="asset-notes-field">Observações <span className="optional-label">Opcional</span><textarea maxLength={255} rows={3} placeholder="Informações adicionais" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
              <div className="asset-modal-actions">
                <button className="modal-cancel" type="button" disabled={submitting} onClick={() => setShowForm(false)}>Cancelar</button>
                <button className="text-action submit-asset" type="submit" disabled={submitting}><Plus size={14} />{submitting ? 'Cadastrando...' : 'Cadastrar ativo'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
