import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AssetsService } from './assets.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AssetsService', () => {
  let service: AssetsService;
  let findAssets: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findAssets = vi.fn().mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: PrismaService, useValue: { asset: { findMany: findAssets } } },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('counts offline and maintenance assets separately from online health', async () => {
    findAssets.mockResolvedValue([
      { status: 'offline' },
      { status: 'maintenance' },
      {
        status: 'online',
        createdAt: new Date(),
        bootedAt: new Date(),
        seed: 12,
        loadFactor: 1,
        totalRamGb: 16,
        totalDiskGb: 512,
        type: 'computer',
      },
    ]);

    const summary = await service.getSummary('company-id');

    expect(summary.total).toBe(3);
    expect(summary.online).toBe(1);
    expect(summary.offline).toBe(1);
    expect(summary.maintenance).toBe(1);
    expect(summary.normal + summary.warning + summary.critical).toBe(1);
    expect(summary.avgNetworkMbps).toBeGreaterThanOrEqual(0);
  });

  it('returns the current resource metrics for every company asset', async () => {
    findAssets.mockResolvedValue([
      {
        id: 'asset-id',
        tag: 'PC-001',
        name: 'Estação',
        type: 'computer',
        status: 'online',
        department: 'TI',
        responsible: 'Ana',
        ip: '192.168.0.10',
        os: 'Linux',
        cpuModel: 'CPU',
        cpuCores: 4,
        totalRamGb: 16,
        totalDiskGb: 512,
        createdAt: new Date(),
        bootedAt: new Date(),
        seed: 12,
        loadFactor: 1,
      },
    ]);

    const results = await service.getCompanyMetrics('company-id');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'asset-id',
      tag: 'PC-001',
      metrics: {
        assetId: 'asset-id',
        status: 'online',
        cpuUsagePercent: expect.any(Number),
        ramUsagePercent: expect.any(Number),
        diskUsagePercent: expect.any(Number),
        networkInMbps: expect.any(Number),
        networkOutMbps: expect.any(Number),
      },
    });
  });
});
