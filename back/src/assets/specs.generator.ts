import { AssetType } from '@prisma/client';

const pick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
const randInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
const hexByte = () => randInt(0, 255).toString(16).padStart(2, '0').toUpperCase();

const PROFILES: Record<
    AssetType,
    {
        os: string[];
        cpus: { model: string; cores: number }[];
        ramGb: number[];
        diskGb: number[];
    }
> = {
    computer: {
        os: ['Windows 11 Pro', 'Windows 10 Pro', 'Ubuntu Desktop 22.04'],
        cpus: [
            { model: 'Intel Core i5-12400', cores: 6 },
            { model: 'Intel Core i7-12700', cores: 12 },
            { model: 'AMD Ryzen 5 5600G', cores: 6 },
            { model: 'AMD Ryzen 7 5700G', cores: 8 },
        ],
        ramGb: [8, 16, 32],
        diskGb: [256, 512, 1000],
    },
    notebook: {
        os: ['Windows 11 Pro', 'Windows 11 Home', 'Ubuntu Desktop 22.04'],
        cpus: [
            { model: 'Intel Core i5-1235U', cores: 10 },
            { model: 'Intel Core i7-1255U', cores: 10 },
            { model: 'AMD Ryzen 5 5500U', cores: 6 },
        ],
        ramGb: [8, 16, 32],
        diskGb: [256, 512, 1000],
    },
    server: {
        os: ['Ubuntu Server 22.04', 'Debian 12', 'Windows Server 2022', 'Red Hat Enterprise Linux 9'],
        cpus: [
            { model: 'Intel Xeon Silver 4314', cores: 16 },
            { model: 'Intel Xeon Gold 6338', cores: 32 },
            { model: 'AMD EPYC 7443P', cores: 24 },
        ],
        ramGb: [32, 64, 128, 256],
        diskGb: [1000, 2000, 4000, 8000],
    },
    switch: {
        os: ['Cisco IOS 15.2', 'HP ProCurve 16.10', 'Mikrotik RouterOS 7'],
        cpus: [
            { model: 'ARM Cortex-A9', cores: 2 },
            { model: 'MIPS 1004Kc', cores: 2 },
        ],
        ramGb: [1, 2, 4],
        diskGb: [16, 32, 64],
    },
};

export function generateSpecs(type: AssetType) {
    const profile = PROFILES[type];
    const cpu = pick(profile.cpus);

    return {
        os: pick(profile.os),
        cpuModel: cpu.model,
        cpuCores: cpu.cores,
        totalRamGb: pick(profile.ramGb),
        totalDiskGb: pick(profile.diskGb),
        ip: `10.0.${randInt(0, 3)}.${randInt(10, 250)}`,
        macAddress: Array.from({ length: 6 }, hexByte).join(':'),
        // "ligado há" entre 1 e 30 dias, para o uptime já nascer realista
        bootedAt: new Date(Date.now() - randInt(1, 30) * 86_400_000),
        seed: randInt(1, 1_000_000),
        // 0.7 = máquina folgada, 1.5 = máquina sempre sobrecarregada (gera alertas)
        loadFactor: Number((0.7 + Math.random() * 0.8).toFixed(2)),
    };
}