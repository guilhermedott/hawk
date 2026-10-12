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
});
