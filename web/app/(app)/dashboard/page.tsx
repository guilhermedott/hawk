'use client';

import {
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Cpu,
  HardDrive,
  MemoryStick,
  MoreHorizontal,
  Network,
  Plus,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';

type AssetSummary = {
  total: number;
  online: number;
  offline: number;
  maintenance: number;
  normal: number;
  warning: number;
  critical: number;
  avgCpuPercent: number;
  avgRamPercent: number;
  avgDiskPercent: number;
  avgNetworkMbps: number;
};

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketSummary = {
  total: number;
  status: Record<TicketStatus, number>;
};
type Ticket = {
  id: string;
  title: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
  asset: { id: string; tag: string; name: string; type: string };
};
type AlertItem = {
  assetId: string;
  tag: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  health: 'warning' | 'critical';
  issues: { metric: string; level: 'warning' | 'critical'; message: string }[];
  collectedAt: string;
};
type AlertsResponse = { generatedAt: string; total: number; items: AlertItem[] };
type DashboardData = {
  assets: AssetSummary;
  tickets: TicketSummary;
  ticketItems: Ticket[];
  alerts: AlertsResponse;
};

const ticketColumns: {
  status: TicketStatus;
  title: string;
  tone: string;
}[] = [
  { status: 'open', title: 'Aberto', tone: 'blue' },
  { status: 'in_progress', title: 'Em andamento', tone: 'orange' },
  { status: 'resolved', title: 'Resolvido', tone: 'green' },
  { status: 'closed', title: 'Fechado', tone: 'purple' },
];

function percentage(value: number, total: number) {
  return total ? `${((value / total) * 100).toFixed(1)}% do total` : '0.0% do total';
}

function formatTimeAgo(dateValue: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000));
  if (!Number.isFinite(seconds)) return 'Data indisponível';
  if (seconds < 60) return 'Agora';
  if (seconds < 3600) return `Há ${Math.floor(seconds / 60)} min`;
  if (seconds < 86_400) return `Há ${Math.floor(seconds / 3600)}h`;
  return `Há ${Math.floor(seconds / 86_400)} dia${seconds >= 172_800 ? 's' : ''}`;
}

function formatDateTime(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return { date: '—', time: '—' };
  return {
    date: new Intl.DateTimeFormat('pt-BR').format(date),
    time: new Intl.DateTimeFormat('pt-BR', { timeStyle: 'medium' }).format(date),
  };
}

function statusLabel(status: TicketStatus) {
  return {
    open: 'Aberto',
    in_progress: 'Em andamento',
    resolved: 'Resolvido',
    closed: 'Fechado',
  }[status];
}

function statusTone(status: TicketStatus) {
  return {
    open: 'blue',
    in_progress: 'orange',
    resolved: 'green',
    closed: 'purple',
  }[status];
}

function DonutChart({
  total,
  segments,
}: {
  total: number;
  segments: { name: string; value: number; tone: string; color: string }[];
}) {
  const circumference = 2 * Math.PI * 43;
  const visibleSegments = segments.filter((segment) => segment.value > 0 && total > 0);

  return (
    <div className="donut-wrap">
      <svg
        viewBox="0 0 112 112"
        className="donut-chart"
        role="img"
        aria-label={`${total} hosts monitorados`}
      >
        <circle cx="56" cy="56" r="43" fill="none" stroke="var(--surface-muted)" strokeWidth="11" />
        {visibleSegments.map((segment, index) => {
          const length = (segment.value / total) * circumference;
          const offset = visibleSegments
            .slice(0, index)
            .reduce((sum, previous) => sum + (previous.value / total) * circumference, 0);
          const circle = (
            <circle
              key={segment.name}
              cx="56"
              cy="56"
              r="43"
              fill="none"
              stroke={segment.color}
              strokeWidth="11"
              strokeDasharray={`${Math.max(0, length - 2)} ${circumference - length + 2}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform="rotate(-90 56 56)"
            />
          );
          return circle;
        })}
        <text x="56" y="53" textAnchor="middle" className="donut-value">{total}</text>
        <text x="56" y="69" textAnchor="middle" className="donut-label">hosts</text>
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshSeconds, setRefreshSeconds] = useState(30);

  const loadDashboard = useCallback(async () => {
    setError('');
    try {
      const [assets, tickets, ticketItems, alerts] = await Promise.all([
        api<AssetSummary>('/assets/summary'),
        api<TicketSummary>('/tickets/summary'),
        api<Ticket[]>('/tickets'),
        api<AlertsResponse>('/alerts'),
      ]);
      setData({ assets, tickets, ticketItems, alerts });
    } catch (err) {
      setError(err instanceof ApiError ? err.messages.join(', ') : 'Não foi possível carregar os dados do painel.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  useEffect(() => {
    const handleRefreshInterval = (event: Event) => {
      const seconds = (event as CustomEvent<number>).detail;
      if (Number.isFinite(seconds) && seconds > 0) setRefreshSeconds(seconds);
    };
    window.addEventListener('hawk:refresh-interval', handleRefreshInterval);
    return () => window.removeEventListener('hawk:refresh-interval', handleRefreshInterval);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => void loadDashboard(), refreshSeconds * 1000);
    return () => window.clearInterval(intervalId);
  }, [loadDashboard, refreshSeconds]);

  if (!data && loading) {
    return <div className="dashboard-state" role="status">Carregando dados do ambiente...</div>;
  }

  if (!data && error) {
    return (
      <div className="dashboard-state dashboard-error" role="alert">
        <CircleAlert size={18} />
        <span>{error}</span>
        <button className="text-action" onClick={() => void loadDashboard()}>
          <RefreshCw size={14} /> Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { assets, tickets, ticketItems, alerts } = data;
  const categories = [
    { name: 'Normal', value: assets.normal, tone: 'green', color: 'var(--green)' },
    { name: 'Atenção', value: assets.warning, tone: 'amber', color: 'var(--amber)' },
    { name: 'Crítico', value: assets.critical, tone: 'red', color: 'var(--red)' },
    { name: 'Offline', value: assets.offline, tone: 'muted', color: 'var(--muted-segment)' },
    { name: 'Manutenção', value: assets.maintenance, tone: 'purple', color: 'var(--purple)' },
  ];
  const metricCards = [
    { label: 'Hosts monitorados', value: assets.total, detail: `Online: ${assets.online}  |  Offline: ${assets.offline}`, icon: Cpu, tone: 'blue' },
    { label: 'Normal', value: assets.normal, detail: percentage(assets.normal, assets.total), icon: Check, tone: 'green' },
    { label: 'Atenção', value: assets.warning, detail: percentage(assets.warning, assets.total), icon: TriangleAlert, tone: 'amber' },
    { label: 'Crítico', value: assets.critical, detail: percentage(assets.critical, assets.total), icon: CircleAlert, tone: 'red' },
  ];
  const resourceMetrics = [
    { name: 'CPU', value: assets.avgCpuPercent, display: `${assets.avgCpuPercent.toLocaleString('pt-BR')}%`, icon: Cpu, tone: 'blue', percent: assets.avgCpuPercent },
    { name: 'Memória', value: assets.avgRamPercent, display: `${assets.avgRamPercent.toLocaleString('pt-BR')}%`, icon: MemoryStick, tone: 'orange', percent: assets.avgRamPercent },
    { name: 'Disco', value: assets.avgDiskPercent, display: `${assets.avgDiskPercent.toLocaleString('pt-BR')}%`, icon: HardDrive, tone: 'green', percent: assets.avgDiskPercent },
    { name: 'Rede', value: assets.avgNetworkMbps, display: `${assets.avgNetworkMbps.toLocaleString('pt-BR')} Mbps`, icon: Network, tone: 'amber', percent: null },
  ];
  const activeAlerts = alerts.items
    .flatMap((alert) => alert.issues.map((issue) => ({
      id: `${alert.assetId}-${issue.metric}`,
      title: `${alert.tag} · ${alert.name}: ${issue.message}`,
      severity: issue.level === 'critical' ? 'Crítico' : 'Atenção',
      tone: issue.level === 'critical' ? 'red' : 'amber',
      status: alert.status === 'offline' ? 'Offline' : 'Ativo',
      collectedAt: alert.collectedAt,
    })))
    .slice(0, 5);
  const recentTickets = [...ticketItems]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="dashboard-grid">
      {error && (
        <div className="dashboard-refresh-error" role="status">
          <CircleAlert size={14} /> Falha ao atualizar: {error}
        </div>
      )}

      <section className="kpi-grid" aria-label="Resumo do ambiente">
        {metricCards.map(({ label, value, detail, icon: Icon, tone }) => (
          <article className={`kpi-card tone-${tone}`} key={label}>
            <div className="kpi-top">
              <span className="kpi-icon"><Icon size={17} strokeWidth={2.1} /></span>
              <button className="icon-button" aria-label={`Mais opções: ${label}`}><MoreHorizontal size={18} /></button>
            </div>
            <div className="kpi-value">{value}</div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-detail">{detail}</div>
          </article>
        ))}
      </section>

      <section className="panel tickets-panel" id="chamados">
        <div className="panel-heading">
          <div>
            <h2>Central de chamados</h2>
            <p>{tickets.total} chamados registrados na empresa</p>
          </div>
          <button className="text-action"><Plus size={15} /> Novo chamado</button>
        </div>
        <div className="kanban-board">
          {ticketColumns.map((column) => (
            <div className={`kanban-column column-${column.tone}`} key={column.status}>
              <div className="kanban-heading">
                <span className="status-dot" />
                <strong>{column.title}</strong>
                <span className="column-count">{tickets.status[column.status]}</span>
                <button className="icon-button" aria-label={`Opções: ${column.title}`}><MoreHorizontal size={17} /></button>
              </div>
              <div className="ticket-list">
                {ticketItems.filter((ticket) => ticket.status === column.status).slice(0, 2).map((ticket) => (
                  <article className="ticket-card" key={ticket.id}>
                    <div className="ticket-id">
                      #{ticket.id.slice(0, 8).toUpperCase()}
                      <span className="ticket-age"><Clock3 size={11} />{formatTimeAgo(ticket.createdAt)}</span>
                    </div>
                    <h3>{ticket.title}</h3>
                    <div className="ticket-user">
                      <span className="tiny-avatar">{ticket.createdBy.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>
                      {ticket.createdBy.name}
                    </div>
                  </article>
                ))}
                {ticketItems.every((ticket) => ticket.status !== column.status) && (
                  <div className="ticket-empty">Nenhum chamado</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <button className="panel-footer-link">Ver todos os chamados <ChevronRight size={14} /></button>
      </section>

      <section className="panel status-panel">
        <div className="panel-heading">
          <div>
            <h2>Status geral do ambiente</h2>
            <p>Distribuição dos hosts monitorados</p>
          </div>
          <button className="icon-button" aria-label="Mais opções"><MoreHorizontal size={18} /></button>
        </div>
        <div className="status-chart-row">
          <DonutChart total={assets.total} segments={categories} />
          <div className="status-legend">
            {categories.map((category) => (
              <div key={category.name}>
                <span className="legend-name"><i className={`legend-dot ${category.tone}`} />{category.name}</span>
                <strong>{category.value} <small>{percentage(category.value, assets.total).replace(' do total', '')}</small></strong>
              </div>
            ))}
          </div>
        </div>
        <div className="status-panel-foot">
          <span><i className="live-indicator" />Atualizado {formatTimeAgo(alerts.generatedAt).toLowerCase()}</span>
          <span>{assets.online} online de {assets.total}</span>
        </div>
      </section>

      <section className="panel resources-panel" id="monitoramento">
        <div className="panel-heading">
          <div>
            <h2>Recursos do sistema</h2>
            <p>Média dos hosts online no momento</p>
          </div>
          <button className="icon-button" aria-label="Atualizar métricas" onClick={() => void loadDashboard()}>
            <RefreshCw size={15} />
          </button>
        </div>
        <div className="resource-grid">
          {resourceMetrics.map(({ name, display, icon: Icon, tone, percent: utilization }) => (
            <article className={`resource-card resource-${tone}`} key={name}>
              <div className="resource-top">
                <span className="resource-icon"><Icon size={15} /></span>
                <span className="resource-name">{name}</span>
              </div>
              <div className="resource-value">{assets.online ? display : '—'}</div>
              {utilization !== null ? (
                <>
                  <div className="metric-track" role="meter" aria-label={`${name} médio`} aria-valuenow={utilization} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${Math.max(0, Math.min(100, utilization))}%` }} />
                  </div>
                  <div className="sparkline-labels"><span>0%</span><span>Média atual</span><span>100%</span></div>
                </>
              ) : (
                <div className="network-note">{assets.online ? 'Tráfego agregado médio' : 'Sem hosts online'}</div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel alerts-panel" id="alertas">
        <div className="panel-heading">
          <div>
            <h2>Alertas ativos <span className="alert-total">{alerts.total}</span></h2>
            <p>Ativos com condições que precisam de atenção</p>
          </div>
          <a className="text-link" href="#alertas">Ver todos <ChevronRight size={14} /></a>
        </div>
        <div className="alerts-list">
          {activeAlerts.map((alert) => (
            <article className="alert-row" key={alert.id}>
              <span className={`alert-indicator ${alert.tone}`} />
              <div className="alert-copy">
                <strong>{alert.title}</strong>
                <span className={`alert-meta ${alert.tone}`}>{alert.severity}<b>·</b>{alert.status}<b>·</b>{formatTimeAgo(alert.collectedAt)}</span>
              </div>
              <ChevronRight size={15} className="alert-chevron" />
            </article>
          ))}
          {activeAlerts.length === 0 && <div className="empty-state">Nenhum alerta ativo no momento.</div>}
        </div>
      </section>

      <section className="panel events-panel" id="eventos">
        <div className="panel-heading">
          <div>
            <h2>Chamados atualizados recentemente</h2>
            <p>Últimos registros de chamados no banco de dados</p>
          </div>
        </div>
        <div className="events-table-wrap">
          <table className="events-table">
            <thead>
              <tr><th>Data / Hora</th><th>Tipo</th><th>Descrição</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentTickets.map((ticket) => {
                const dateTime = formatDateTime(ticket.updatedAt);
                return (
                  <tr key={ticket.id}>
                    <td><strong>{dateTime.date}</strong><span>{dateTime.time}</span></td>
                    <td><span className="event-type">Chamado</span></td>
                    <td className="event-description">#{ticket.id.slice(0, 8).toUpperCase()} · {ticket.title}</td>
                    <td><span className={`status-badge ${statusTone(ticket.status)}`}>{statusLabel(ticket.status)}</span></td>
                  </tr>
                );
              })}
              {recentTickets.length === 0 && (
                <tr><td colSpan={4} className="empty-state">Nenhum chamado registrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <footer className="dashboard-footer">
        <span>HAWK Infrastructure Monitor</span>
        <span>Sincronizado {formatTimeAgo(alerts.generatedAt).toLowerCase()} <i className="live-indicator" /></span>
      </footer>
    </div>
  );
}
