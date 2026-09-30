import { AssetStatus } from '@prisma/client';

export type AssetHealth = 'ok' | 'warning' | 'critical';

export interface HealthIssue {
    metric: string;
    level: 'warning' | 'critical';
    message: string;
}

export interface AssetMetrics {
    assetId: string;
    collectedAt: string;
    status: AssetStatus;
    health: AssetHealth;
    issues: HealthIssue[];
    uptimeSeconds: number;
    // ausentes quando o ativo está offline ou em manutenção
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
    connectedDevices?: number; // só servidores
}