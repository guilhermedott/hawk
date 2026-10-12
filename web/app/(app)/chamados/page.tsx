'use client';

import { ClipboardList, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { DataPageState } from '@/components/dashboard/DataPageState';
import { useDashboardData } from '@/components/dashboard/useDashboardData';
import { api } from '@/lib/api';
import {
  formatDateTime,
  ticketStatusLabel,
  ticketStatusTone,
  ticketStatuses,
  type Ticket,
  type TicketSummary,
} from '@/lib/dashboard-types';

type TicketsData = { summary: TicketSummary; items: Ticket[] };

export default function ChamadosPage() {
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const loadData = useCallback(async (): Promise<TicketsData> => {
    const [summary, items] = await Promise.all([
      api<TicketSummary>('/tickets/summary'),
      api<Ticket[]>('/tickets'),
    ]);
    return { summary, items };
  }, []);
  const { data, loading, error, reload } = useDashboardData(loadData);
  const tickets = useMemo(() => (data?.items ?? [])
    .filter((ticket) => status === 'all' || ticket.status === status)
    .filter((ticket) => `${ticket.title} ${ticket.asset.tag} ${ticket.createdBy.name}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [data, status, query]);

  return (
    <div className="data-page">
      <DataPageState loading={loading && !data} error={error && !data ? error : ''} retry={reload} />
      {error && data && <div className="dashboard-refresh-error" role="status">{error}</div>}
      {data && (
        <>
          <section className="page-stat-grid ticket-stat-grid">
            {ticketStatuses.map((item) => (
              <article className="page-stat-card" key={item.status}>
                <span className={`page-stat-icon ${item.tone}`}><ClipboardList size={17} /></span>
                <div><strong>{data.summary.status[item.status]}</strong><span>{item.title}</span></div>
              </article>
            ))}
          </section>
          <section className="panel data-panel">
            <div className="panel-heading">
              <div><h2>Todos os chamados</h2><p>{tickets.length} de {data.summary.total} chamados</p></div>
              <div className="data-filters">
                <label className="search-field"><Search size={14} /><input aria-label="Buscar chamados" placeholder="Buscar chamado, ativo ou solicitante" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
                <select className="data-select" aria-label="Filtrar por status" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="all">Todos os status</option>
                  {ticketStatuses.map((item) => <option key={item.status} value={item.status}>{item.title}</option>)}
                </select>
              </div>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Chamado</th><th>Ativo</th><th>Solicitante</th><th>Responsável</th><th>Prioridade</th><th>Status</th><th>Criado em</th></tr></thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td><strong>#{ticket.id.slice(0, 8).toUpperCase()}</strong><span className="table-secondary">{ticket.title}</span></td>
                      <td><strong>{ticket.asset.tag}</strong><span className="table-secondary">{ticket.asset.name}</span></td>
                      <td>{ticket.createdBy.name}</td>
                      <td>{ticket.assignedTo?.name ?? 'Não atribuído'}</td>
                      <td><span className={`priority-label priority-${ticket.priority}`}>{ticket.priority === 'critical' ? 'Crítica' : ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Média' : 'Baixa'}</span></td>
                      <td><span className={`status-badge ${ticketStatusTone(ticket.status)}`}>{ticketStatusLabel(ticket.status)}</span></td>
                      <td>{formatDateTime(ticket.createdAt).date}</td>
                    </tr>
                  ))}
                  {tickets.length === 0 && <tr><td colSpan={7} className="table-empty">Nenhum chamado encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
