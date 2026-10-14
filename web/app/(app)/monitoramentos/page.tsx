'use client';

import { Activity, Cpu, HardDrive, MemoryStick, RefreshCw, Server } from 'lucide-react';
import { useCallback } from 'react';
import { DataPageState } from '@/components/dashboard/DataPageState';
import { useDashboardData } from '@/components/dashboard/useDashboardData';
import { api } from '@/lib/api';
import {
  type Asset,
  type AssetMetrics,
  type AssetSummary,
  assetStatusLabel,
} from '@/lib/dashboard-types';

type MonitoredAsset = { asset: Asset; metrics: AssetMetrics };
type MonitoringData = { summary: AssetSummary; assets: MonitoredAsset[] };

const lanes = [
  { title: 'Normal', key: 'ok', tone: 'green' },
  { title: 'Atenção', key: 'warning', tone: 'amber' },
  { title: 'Crítico', key: 'critical', tone: 'red' },
  { title: 'Offline / Manutenção', key: 'offline', tone: 'muted' },
] as const;

export default function MonitoramentosPage() {
  const loadData = useCallback(async (): Promise<MonitoringData> => {
    const [summary, assets] = await Promise.all([
      api<AssetSummary>('/assets/summary'),
      api<Asset[]>('/assets'),
    ]);
    const monitored = await Promise.all(
      assets.map(async (asset) => ({
        asset,
        metrics: await api<AssetMetrics>(`/assets/${asset.id}/metrics`),
      })),
    );
    return { summary, assets: monitored };
  }, []);
  const { data, loading, error, reload } = useDashboardData(loadData);

  return (
    <div className="data-page">
      <DataPageState loading={loading && !data} error={error && !data ? error : ''} retry={reload} />
      {error && data && <div className="dashboard-refresh-error" role="status">{error}</div>}
      {data && (
        <>
          <section className="page-stat-grid">
            <article className="page-stat-card"><span className="page-stat-icon blue"><Server size={17} /></span><div><strong>{data.summary.total}</strong><span>Ativos monitorados</span></div></article>
            <article className="page-stat-card"><span className="page-stat-icon green"><Activity size={17} /></span><div><strong>{data.summary.online}</strong><span>Online agora</span></div></article>
            <article className="page-stat-card"><span className="page-stat-icon blue"><Cpu size={17} /></span><div><strong>{data.summary.avgCpuPercent}%</strong><span>CPU média</span></div></article>
            <article className="page-stat-card"><span className="page-stat-icon orange"><MemoryStick size={17} /></span><div><strong>{data.summary.avgRamPercent}%</strong><span>Memória média</span></div></article>
            <article className="page-stat-card"><span className="page-stat-icon green"><HardDrive size={17} /></span><div><strong>{data.summary.avgDiskPercent}%</strong><span>Disco médio</span></div></article>
          </section>

          <section className="panel data-panel monitoring-board">
            <div className="panel-heading">
              <div><h2>Estado dos ativos</h2><p>Kanban atualizado com o estado e a saúde dos equipamentos</p></div>
              <button className="icon-button" aria-label="Atualizar monitoramentos" onClick={() => void reload()}><RefreshCw size={15} /></button>
            </div>
            <div className="asset-kanban">
              {lanes.map((lane) => {
                const laneAssets = data.assets.filter(({ metrics }) =>
                  lane.key === 'offline'
                    ? metrics.status !== 'online'
                    : metrics.health === lane.key,
                );
                return (
                  <section className={`asset-lane lane-${lane.tone}`} key={lane.key}>
                    <div className="asset-lane-title">
                      <span className="status-dot" />
                      <strong>{lane.title}</strong>
                      <span className="column-count">{laneAssets.length}</span>
                    </div>
                    <div className="asset-lane-list">
                      {laneAssets.map(({ asset, metrics }) => (
                        <article className="asset-kanban-card" key={asset.id}>
                          <div className="asset-card-heading"><span>{asset.tag}</span><span className={`status-badge ${lane.tone}`}>{assetStatusLabel(metrics.status)}</span></div>
                          <strong>{asset.name}</strong>
                          <small>{asset.department} · {asset.type}</small>
                          <div className="asset-resource-lines">
                            <span>CPU <b>{metrics.cpuUsagePercent === undefined ? '—' : `${metrics.cpuUsagePercent}%`}</b></span>
                            <span>RAM <b>{metrics.ramUsagePercent === undefined ? '—' : `${metrics.ramUsagePercent}%`}</b></span>
                            <span>Disco <b>{metrics.diskUsagePercent === undefined ? '—' : `${metrics.diskUsagePercent}%`}</b></span>
                          </div>
                          {metrics.issues.length > 0 && <p className="asset-issue">{metrics.issues[0].message}</p>}
                        </article>
                      ))}
                      {laneAssets.length === 0 && <div className="lane-empty">Nenhum ativo</div>}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
