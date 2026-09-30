import { Injectable } from '@nestjs/common';
import { generateMetrics } from '../assets/metrics.generator.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AlertsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(level?: 'warning' | 'critical') {
        const assets = await this.prisma.asset.findMany();

        const items = assets
            .map((asset) => ({ asset, m: generateMetrics(asset) }))
            .filter(({ m }) => m.health !== 'ok')
            .filter(({ m }) => !level || m.health === level)
            .map(({ asset, m }) => ({
                assetId: asset.id,
                tag: asset.tag,
                name: asset.name,
                type: asset.type,
                department: asset.department,
                status: m.status,
                health: m.health,
                issues: m.issues,
                collectedAt: m.collectedAt,
            }))
            .sort((a, b) => Number(b.health === 'critical') - Number(a.health === 'critical'));

        return { generatedAt: new Date().toISOString(), total: items.length, items };
    }
}