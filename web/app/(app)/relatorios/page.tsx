'use client';

import { Download, FileSpreadsheet } from 'lucide-react';
import { useCallback } from 'react';
import { DataPageState } from '@/components/dashboard/DataPageState';
import { useDashboardData } from '@/components/dashboard/useDashboardData';
import { api } from '@/lib/api';
import {
  assetStatusLabel,
  assetTypeLabel,
  type AlertsResponse,
  type Asset,
  type TicketSummary,
  ticketStatusLabel,
  ticketStatuses,
} from '@/lib/dashboard-types';

type AssetMetrics = {
  collectedAt: string;
  status: string;
  health: string;
  cpuUsagePercent?: number;
  ramUsedGb?: number;
  ramTotalGb?: number;
  ramUsagePercent?: number;
  diskUsedGb?: number;
  diskFreeGb?: number;
  diskTotalGb?: number;
  diskUsagePercent?: number;
  networkInMbps?: number;
  networkOutMbps?: number;
  temperatureC?: number;
  uptimeSeconds: number;
};
type AssetWithMetrics = Pick<
  Asset,
  | 'id'
  | 'tag'
  | 'name'
  | 'type'
  | 'status'
  | 'department'
  | 'responsible'
  | 'ip'
  | 'os'
> & {
  cpuModel: string;
  cpuCores: number;
  totalRamGb: number;
  totalDiskGb: number;
  metrics: AssetMetrics;
};
type ReportsData = {
  assets: Asset[];
  metrics: AssetWithMetrics[];
  summary: TicketSummary;
  alerts: AlertsResponse;
};
type Report = { id: string; title: string; description: string; count: (data: ReportsData) => number; rows: (data: ReportsData) => string[][] };

const reports: Report[] = [
  {
    id: 'disponibilidade',
    title: 'Disponibilidade dos ativos',
    description: 'Status atual, setor e responsável de cada equipamento.',
    count: (data) => data.assets.length,
    rows: (data) => [['Tag', 'Ativo', 'Status', 'Setor', 'Responsável'], ...data.assets.map((asset) => [asset.tag, asset.name, assetStatusLabel(asset.status), asset.department, asset.responsible])],
  },
  {
    id: 'inventario',
    title: 'Inventário de ativos',
    description: 'Relação dos equipamentos cadastrados e suas informações.',
    count: (data) => data.assets.length,
    rows: (data) => [['Tag', 'Ativo', 'Tipo', 'Setor', 'Responsável', 'IP', 'Sistema operacional'], ...data.assets.map((asset) => [asset.tag, asset.name, assetTypeLabel(asset.type), asset.department, asset.responsible, asset.ip, asset.os])],
  },
  {
    id: 'recursos',
    title: 'Consumo de recursos dos equipamentos',
    description: 'Snapshot de CPU, memória, disco, rede, temperatura e disponibilidade por equipamento.',
    count: (data) => data.metrics.length,
    rows: (data) => [
      ['Tag', 'Equipamento', 'Status', 'Saúde', 'Coletado em', 'CPU (%)', 'RAM usada (GB)', 'RAM total (GB)', 'RAM (%)', 'Disco usado (GB)', 'Disco livre (GB)', 'Disco total (GB)', 'Disco (%)', 'Rede entrada (Mbps)', 'Rede saída (Mbps)', 'Temperatura (°C)', 'Uptime (s)'],
      ...data.metrics.map(({ tag, name, metrics }) => [
        tag,
        name,
        metrics.status,
        metrics.health,
        metrics.collectedAt,
        String(metrics.cpuUsagePercent ?? ''),
        String(metrics.ramUsedGb ?? ''),
        String(metrics.ramTotalGb ?? ''),
        String(metrics.ramUsagePercent ?? ''),
        String(metrics.diskUsedGb ?? ''),
        String(metrics.diskFreeGb ?? ''),
        String(metrics.diskTotalGb ?? ''),
        String(metrics.diskUsagePercent ?? ''),
        String(metrics.networkInMbps ?? ''),
        String(metrics.networkOutMbps ?? ''),
        String(metrics.temperatureC ?? ''),
        String(metrics.uptimeSeconds),
      ]),
    ],
  },
  {
    id: 'chamados',
    title: 'Chamados por status',
    description: 'Distribuição dos chamados agrupada pela situação atual.',
    count: (data) => data.summary.total,
    rows: (data) => [['Status', 'Quantidade'], ...ticketStatuses.map((item) => [ticketStatusLabel(item.status), String(data.summary.status[item.status])])],
  },
  {
    id: 'alertas',
    title: 'Histórico de alertas ativos',
    description: 'Condições atuais detectadas nos ativos monitorados.',
    count: (data) => data.alerts.total,
    rows: (data) => [['Tag', 'Ativo', 'Prioridade', 'Métrica', 'Descrição', 'Detectado em'], ...data.alerts.items.flatMap((item) => item.issues.map((issue) => [item.tag, item.name, issue.level === 'critical' ? 'Crítico' : 'Atenção', issue.metric, issue.message, item.collectedAt]))],
  },
];

function exportCsv(report: Report, data: ReportsData) {
  const csv = report.rows(data)
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';'))
    .join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hawk-${report.id}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function RelatoriosPage() {
  const loadData = useCallback(async (): Promise<ReportsData> => {
    const [assets, metrics, summary, alerts] = await Promise.all([
      api<Asset[]>('/assets'),
      api<AssetWithMetrics[]>('/assets/metrics'),
      api<TicketSummary>('/tickets/summary'),
      api<AlertsResponse>('/alerts'),
    ]);
    return { assets, metrics, summary, alerts };
  }, []);
  const { data, loading, error, reload } = useDashboardData(loadData);

  return (
    <div className="data-page">
      <DataPageState loading={loading && !data} error={error && !data ? error : ''} retry={reload} />
      {error && data && <div className="dashboard-refresh-error" role="status">{error}</div>}
      {data && (
        <section className="report-grid">
          {reports.map((report) => (
            <article className="panel report-card" key={report.id}>
              <span className="report-icon"><FileSpreadsheet size={19} /></span>
              <div className="report-card-body">
                <h2>{report.title}</h2>
                <p>{report.description}</p>
                <span className="report-row-count">{report.count(data)} registros disponíveis</span>
              </div>
              <button className="text-action" onClick={() => exportCsv(report, data)}><Download size={14} /> Exportar CSV</button>
            </article>
          ))}
          <div className="report-note">As métricas de recursos são geradas pelo backend para demonstração, não coletadas diretamente dos equipamentos. O relatório é um snapshot; métricas históricas não são armazenadas.</div>
        </section>
      )}
    </div>
  );
}
