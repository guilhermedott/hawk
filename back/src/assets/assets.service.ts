import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { QueryAssetsDto } from './dto/query-assets.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { clamp, generateMetrics } from './metrics.generator.js';
import { generateSpecs } from './specs.generator.js';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) { }

  findAll(companyId: string, { type, status, search }: QueryAssetsDto) {
    return this.prisma.asset.findMany({
      where: {
        companyId,
        type,
        status,
        ...(search && {
          OR: [
            { tag: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { department: { contains: search, mode: 'insensitive' } },
            { responsible: { contains: search, mode: 'insensitive' } },
            { ip: { contains: search } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 404 também para ativo de outra empresa (não revela que ele existe)
  async findOne(companyId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({ where: { id, companyId } });
    if (!asset) throw new NotFoundException(`Ativo ${id} não encontrado`);
    return asset;
  }

  async create(companyId: string, dto: CreateAssetDto) {
    try {
      return await this.prisma.asset.create({
        data: { ...dto, companyId, ...generateSpecs(dto.type) },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Já existe um ativo com a tag ${dto.tag} na sua empresa`);
      }
      throw e;
    }
  }

  async update(companyId: string, id: string, dto: UpdateAssetDto) {
    const current = await this.findOne(companyId, id);
    const rebooted = dto.status === 'online' && current.status !== 'online';
    return this.prisma.asset.update({
      where: { id },
      data: { ...dto, ...(rebooted && { bootedAt: new Date() }) },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.asset.delete({ where: { id } });
    return { deleted: true, id };
  }

  async getMetrics(companyId: string, id: string) {
    return generateMetrics(await this.findOne(companyId, id));
  }

  async getHistory(companyId: string, id: string, rangeMinutes: number, points: number) {
    const asset = await this.findOne(companyId, id);
    const range = clamp(rangeMinutes, 5, 1440);
    const n = clamp(points, 10, 120);
    const end = Date.now();
    const step = (range * 60_000) / n;

    const series = Array.from({ length: n }, (_, i) => {
      const m = generateMetrics(asset, end - (n - 1 - i) * step);
      return {
        timestamp: m.collectedAt,
        cpuUsagePercent: m.cpuUsagePercent,
        ramUsagePercent: m.ramUsagePercent,
        diskUsagePercent: m.diskUsagePercent,
        networkInMbps: m.networkInMbps,
        networkOutMbps: m.networkOutMbps,
        temperatureC: m.temperatureC,
        health: m.health,
      };
    });

    return { assetId: id, rangeMinutes: range, points: n, series };
  }

  async getSummary(companyId: string) {
    const assets = await this.prisma.asset.findMany({ where: { companyId } });
    const all = assets.map((asset) => ({ asset, m: generateMetrics(asset) }));
    const online = all.filter((x) => x.m.status === 'online');
    const avg = (pick: (m: (typeof all)[0]['m']) => number | undefined) =>
      online.length
        ? Number((online.reduce((s, x) => s + (pick(x.m) ?? 0), 0) / online.length).toFixed(1))
        : 0;

    return {
      total: all.length,
      online: online.length,
      offline: all.filter((x) => x.m.status === 'offline').length,
      maintenance: all.filter((x) => x.m.status === 'maintenance').length,
      warning: all.filter((x) => x.m.health === 'warning').length,
      critical: all.filter((x) => x.m.health === 'critical').length,
      avgCpuPercent: avg((m) => m.cpuUsagePercent),
      avgRamPercent: avg((m) => m.ramUsagePercent),
      avgDiskPercent: avg((m) => m.diskUsagePercent),
    };
  }
}