import { Asset } from '@prisma/client';
import { AssetHealth, AssetMetrics, HealthIssue } from './metrics.types.js';

export const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));
const round = (v: number, d = 1) => Number(v.toFixed(d));

// valor entre 0 e 1, determinístico: mesmo ativo + mesmo instante = mesmo resultado
function wave(seed: number, t: number, slowMs: number, fastMs: number, salt = 0) {
    const s = seed + salt * 7.3;
    return clamp(
        0.5 + 0.35 * Math.sin(t / slowMs + s) + 0.15 * Math.sin(t / fastMs + s * 2),
        0,
        1,
    );
}

const NETWORK_MAX_MBPS = { computer: 100, notebook: 100, server: 900, switch: 1000 };

function evaluate(v: { cpu: number; ram: number; disk: number; temp: number }) {
    const rules = [
        { metric: 'CPU', value: v.cpu, warn: 75, crit: 90, unit: '%' },
        { metric: 'RAM', value: v.ram, warn: 75, crit: 90, unit: '%' },
        { metric: 'Disco', value: v.disk, warn: 80, crit: 90, unit: '%' },
        { metric: 'Temperatura', value: v.temp, warn: 70, crit: 80, unit: '°C' },
    ];

    const issues: HealthIssue[] = [];
    for (const r of rules) {
        const message = `${r.metric} em ${r.value}${r.unit}`;
        if (r.value >= r.crit) issues.push({ metric: r.metric, level: 'critical', message });
        else if (r.value >= r.warn) issues.push({ metric: r.metric, level: 'warning', message });
    }

    const health: AssetHealth = issues.some((i) => i.level === 'critical')
        ? 'critical'
        : issues.length > 0
            ? 'warning'
            : 'ok';

    return { health, issues };
}

export function generateMetrics(asset: Asset, at: number = Date.now()): AssetMetrics {
    const base = {
        assetId: asset.id,
        collectedAt: new Date(at).toISOString(),
        status: asset.status,
    };

    if (asset.status === 'offline') {
        return {
            ...base,
            health: 'critical',
            issues: [{ metric: 'Status', level: 'critical', message: 'Ativo offline' }],
            uptimeSeconds: 0,
        };
    }

    if (asset.status === 'maintenance') {
        return { ...base, health: 'ok', issues: [], uptimeSeconds: 0 };
    }

    const { seed, loadFactor } = asset;

    const cpu = round(clamp((10 + wave(seed, at, 60_000, 9_000, 0) * 70) * loadFactor, 1, 100));
    const ramPct = round(clamp((25 + wave(seed, at, 120_000, 15_000, 1) * 50) * loadFactor, 10, 97));

    // disco: ocupação base do ativo + crescimento lento com o tempo (quase não oscila)
    const daysSinceCreated = Math.max(0, (at - asset.createdAt.getTime()) / 86_400_000);
    const diskPct = round(
        clamp(
            30 + (seed % 55) + daysSinceCreated * 0.05 + wave(seed, at, 3_600_000, 600_000, 2) * 0.5,
            5,
            97,
        ),
    );

    const temp = round(32 + cpu * 0.55);

    // valores sempre limitados pelas especificações do ativo
    const ramUsed = round((asset.totalRamGb * ramPct) / 100);
    const diskUsed = round((asset.totalDiskGb * diskPct) / 100);
    const netMax = NETWORK_MAX_MBPS[asset.type];

    const { health, issues } = evaluate({ cpu, ram: ramPct, disk: diskPct, temp });

    return {
        ...base,
        health,
        issues,
        uptimeSeconds: Math.max(0, Math.floor((at - asset.bootedAt.getTime()) / 1000)),
        cpuUsagePercent: cpu,
        ramUsedGb: ramUsed,
        ramTotalGb: asset.totalRamGb,
        ramUsagePercent: ramPct,
        diskUsedGb: diskUsed,
        diskFreeGb: round(asset.totalDiskGb - diskUsed),
        diskTotalGb: asset.totalDiskGb,
        diskUsagePercent: diskPct,
        networkInMbps: round(wave(seed, at, 30_000, 5_000, 3) * netMax),
        networkOutMbps: round(wave(seed, at, 40_000, 7_000, 4) * netMax * 0.6),
        temperatureC: temp,
        ...(asset.type === 'server' && {
            connectedDevices: Math.round(10 + wave(seed, at, 90_000, 12_000, 5) * 190),
        }),
    };
}