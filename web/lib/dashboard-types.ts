export type AssetStatus = 'online' | 'offline' | 'maintenance';
export type AssetHealth = 'ok' | 'warning' | 'critical';

export type Asset = {
  id: string;
  tag: string;
  name: string;
  type: 'computer' | 'notebook' | 'server' | 'switch';
  status: AssetStatus;
  department: string;
  responsible: string;
  notes: string | null;
  ip: string;
  os: string;
  createdAt: string;
};

export type AssetMetrics = {
  assetId: string;
  collectedAt: string;
  status: AssetStatus;
  health: AssetHealth;
  issues: { metric: string; level: 'warning' | 'critical'; message: string }[];
  cpuUsagePercent?: number;
  ramUsagePercent?: number;
  diskUsagePercent?: number;
  networkInMbps?: number;
  networkOutMbps?: number;
};

export type AssetSummary = {
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

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
  asset: { id: string; tag: string; name: string; type: string };
};

export type TicketSummary = {
  total: number;
  status: Record<TicketStatus, number>;
  openByPriority: Record<'low' | 'medium' | 'high' | 'critical', number>;
};

export type AlertItem = {
  assetId: string;
  tag: string;
  name: string;
  type: Asset['type'];
  department: string;
  status: AssetStatus;
  health: 'warning' | 'critical';
  issues: { metric: string; level: 'warning' | 'critical'; message: string }[];
  openTickets: number;
  collectedAt: string;
};

export type AlertsResponse = { generatedAt: string; total: number; items: AlertItem[] };

export const ticketStatuses: { status: TicketStatus; title: string; tone: string }[] = [
  { status: 'open', title: 'Aberto', tone: 'blue' },
  { status: 'in_progress', title: 'Em andamento', tone: 'orange' },
  { status: 'resolved', title: 'Resolvido', tone: 'green' },
  { status: 'closed', title: 'Fechado', tone: 'purple' },
];

export function ticketStatusLabel(status: TicketStatus) {
  return ticketStatuses.find((item) => item.status === status)?.title ?? status;
}

export function ticketStatusTone(status: TicketStatus) {
  return ticketStatuses.find((item) => item.status === status)?.tone ?? 'blue';
}

export function formatTimeAgo(dateValue: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000));
  if (!Number.isFinite(seconds)) return 'Data indisponível';
  if (seconds < 60) return 'Agora';
  if (seconds < 3600) return `Há ${Math.floor(seconds / 60)} min`;
  if (seconds < 86_400) return `Há ${Math.floor(seconds / 3600)}h`;
  return `Há ${Math.floor(seconds / 86_400)} dia${seconds >= 172_800 ? 's' : ''}`;
}

export function formatDateTime(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return { date: '—', time: '—' };
  return {
    date: new Intl.DateTimeFormat('pt-BR').format(date),
    time: new Intl.DateTimeFormat('pt-BR', { timeStyle: 'medium' }).format(date),
  };
}

export function percentage(value: number, total: number) {
  return total ? `${((value / total) * 100).toFixed(1)}%` : '0.0%';
}

export function assetStatusLabel(status: Asset['status']) {
  return { online: 'Online', offline: 'Offline', maintenance: 'Manutenção' }[status];
}

export function assetTypeLabel(type: Asset['type']) {
  return { computer: 'Computador', notebook: 'Notebook', server: 'Servidor', switch: 'Switch' }[type];
}

export function alertPriority(level: 'warning' | 'critical') {
  return level === 'critical' ? 'Crítico' : 'Atenção';
}
