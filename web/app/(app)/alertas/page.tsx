'use client';

import { AlertTriangle, CircleAlert, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { DataPageState } from '@/components/dashboard/DataPageState';
import { useDashboardData } from '@/components/dashboard/useDashboardData';
import { api } from '@/lib/api';
import { alertPriority, formatTimeAgo, type AlertsResponse } from '@/lib/dashboard-types';

export default function AlertasPage() {
  const [priority, setPriority] = useState('all');
  const [search, setSearch] = useState('');
  const loadData = useCallback(() => api<AlertsResponse>('/alerts'), []);
  const { data, loading, error, reload } = useDashboardData(loadData);
  const alerts = useMemo(() => {
    if (!data) return [];
    return data.items
      .flatMap((item) => item.issues.map((issue) => ({
        id: `${item.assetId}-${issue.metric}`,
        tag: item.tag,
        name: item.name,
        department: item.department,
        message: issue.message,
        level: issue.level,
        collectedAt: item.collectedAt,
        status: item.status,
        openTickets: item.openTickets,
      })))
      .filter((alert) => priority === 'all' || alert.level === priority)
      .filter((alert) => `${alert.tag} ${alert.name} ${alert.message}`.toLowerCase().includes(search.toLowerCase()));
  }, [data, priority, search]);

  return (
    <div className="data-page">
      <DataPageState loading={loading && !data} error={error && !data ? error : ''} retry={reload} />
      {error && data && <div className="dashboard-refresh-error" role="status">{error}</div>}
      {data && (
        <>
          <section className="page-stat-grid two-stats">
            <article className="page-stat-card"><span className="page-stat-icon red"><CircleAlert size={17} /></span><div><strong>{data.items.filter((item) => item.health === 'critical').length}</strong><span>Ativos críticos</span></div></article>
            <article className="page-stat-card"><span className="page-stat-icon amber"><AlertTriangle size={17} /></span><div><strong>{data.items.filter((item) => item.health === 'warning').length}</strong><span>Ativos em atenção</span></div></article>
          </section>
          <section className="panel data-panel">
            <div className="panel-heading">
              <div><h2>Alertas por prioridade</h2><p>{alerts.length} condições correspondem aos filtros</p></div>
              <div className="data-filters">
                <label className="search-field"><Search size={14} /><input aria-label="Buscar alertas" placeholder="Buscar ativo ou alerta" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                <select className="data-select" aria-label="Filtrar por prioridade" value={priority} onChange={(event) => setPriority(event.target.value)}>
                  <option value="all">Todas as prioridades</option>
                  <option value="critical">Crítico</option>
                  <option value="warning">Atenção</option>
                </select>
              </div>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Prioridade</th><th>Ativo</th><th>Alerta</th><th>Chamados abertos</th><th>Detectado</th></tr></thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td><span className={`status-badge ${alert.level === 'critical' ? 'red' : 'amber'}`}>{alertPriority(alert.level)}</span></td>
                      <td><strong>{alert.tag}</strong><span className="table-secondary">{alert.name} · {alert.department}</span></td>
                      <td>{alert.message}</td>
                      <td>{alert.openTickets}</td>
                      <td>{formatTimeAgo(alert.collectedAt)}</td>
                    </tr>
                  ))}
                  {alerts.length === 0 && <tr><td colSpan={5} className="table-empty">Nenhum alerta encontrado para estes filtros.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
