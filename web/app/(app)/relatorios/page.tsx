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

type ReportsData = {
  assets: Asset[];
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
    const [assets, summary, alerts] = await Promise.all([
      api<Asset[]>('/assets'),
      api<TicketSummary>('/tickets/summary'),
      api<AlertsResponse>('/alerts'),
    ]);
    return { assets, summary, alerts };
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
          <div className="report-note">Relatórios gerados com os dados atuais da empresa. O backend ainda não mantém versões históricas de relatórios ou eventos de auditoria.</div>
        </section>
      )}
    </div>
  );
}
