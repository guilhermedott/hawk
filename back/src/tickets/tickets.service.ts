import {
    BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { Prisma, TicketPriority, TicketStatus } from '@prisma/client';
import { generateMetrics } from '../assets/metrics.generator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { QueryTicketsDto } from './dto/query-tickets.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';

const include = {
    asset: { select: { id: true, tag: true, name: true, type: true } },
    createdBy: { select: { id: true, name: true } },
    assignedTo: { select: { id: true, name: true } },
} satisfies Prisma.TicketInclude;

const CLOSED: TicketStatus[] = ['resolved', 'closed'];
const ACTIVE: TicketStatus[] = ['open', 'in_progress'];

@Injectable()
export class TicketsService {
    constructor(private readonly prisma: PrismaService) { }

    private async assertAssignee(companyId: string, userId: string) {
        const member = await this.prisma.membership.findFirst({ where: { userId, companyId } });
        if (!member) {
            throw new BadRequestException('O responsável deve ser membro da empresa');
        }
    }

    findAll(
        companyId: string,
        { status, priority, assetId, assignedToId, search }: QueryTicketsDto,
    ) {
        return this.prisma.ticket.findMany({
            where: {
                companyId,
                status,
                priority,
                assetId,
                assignedToId,
                ...(search && {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                        { asset: { tag: { contains: search, mode: 'insensitive' } } },
                    ],
                }),
            },
            include,
            orderBy: { createdAt: 'desc' },
        });
    }

    // 404 também para chamado de outra empresa
    async findOne(companyId: string, id: string) {
        const ticket = await this.prisma.ticket.findFirst({ where: { id, companyId }, include });
        if (!ticket) throw new NotFoundException('Chamado não encontrado');
        return ticket;
    }

    async create(companyId: string, userId: string, dto: CreateTicketDto) {
        const asset = await this.prisma.asset.findFirst({
            where: { id: dto.assetId, companyId },
        });
        if (!asset) throw new NotFoundException('Ativo não encontrado');

        return this.prisma.ticket.create({
            data: { ...dto, companyId, createdById: userId },
            include,
        });
    }

    async update(companyId: string, id: string, dto: UpdateTicketDto) {
        const current = await this.findOne(companyId, id);

        if (dto.assignedToId) await this.assertAssignee(companyId, dto.assignedToId);

        let resolvedAt: Date | null | undefined;
        if (dto.status && dto.status !== current.status) {
            resolvedAt = CLOSED.includes(dto.status) ? new Date() : null;
        }

        return this.prisma.ticket.update({
            where: { id },
            data: { ...dto, ...(resolvedAt !== undefined && { resolvedAt }) },
            include,
        });
    }

    async remove(companyId: string, role: 'owner' | 'member', id: string) {
        if (role !== 'owner') {
            throw new ForbiddenException('Apenas o dono da empresa pode excluir chamados');
        }
        await this.findOne(companyId, id);
        await this.prisma.ticket.delete({ where: { id } });
        return { deleted: true, id };
    }

    async getSummary(companyId: string) {
        const [byStatus, byPriority] = await Promise.all([
            this.prisma.ticket.groupBy({
                by: ['status'],
                where: { companyId },
                _count: { _all: true },
            }),
            this.prisma.ticket.groupBy({
                by: ['priority'],
                where: { companyId, status: { in: ACTIVE } },
                _count: { _all: true },
            }),
        ]);

        const status: Record<TicketStatus, number> = {
            open: 0, in_progress: 0, resolved: 0, closed: 0,
        };
        byStatus.forEach((r) => (status[r.status] = r._count._all));

        const openByPriority: Record<TicketPriority, number> = {
            low: 0, medium: 0, high: 0, critical: 0,
        };
        byPriority.forEach((r) => (openByPriority[r.priority] = r._count._all));

        return {
            total: Object.values(status).reduce((a, b) => a + b, 0),
            status,
            openByPriority,
        };
    }

    // sugestão para o botão "abrir chamado" a partir de um ativo em alerta
    async getDraft(companyId: string, assetId: string) {
        const asset = await this.prisma.asset.findFirst({ where: { id: assetId, companyId } });
        if (!asset) throw new NotFoundException('Ativo não encontrado');

        const m = generateMetrics(asset);
        const offline = m.status === 'offline';

        const priority: TicketPriority = offline
            ? 'critical'
            : m.health === 'critical'
                ? 'high'
                : m.health === 'warning'
                    ? 'medium'
                    : 'low';

        const title = m.issues.length
            ? `[${asset.tag}] ${m.issues[0].message}`
            : `[${asset.tag}] Verificação solicitada`;

        const description = m.issues.length
            ? `Problemas detectados automaticamente pelo HAWK em ${m.collectedAt}:\n` +
            m.issues.map((i) => `- ${i.message}`).join('\n')
            : `Chamado aberto manualmente para o ativo ${asset.tag} (${asset.name}).`;

        return { assetId, title, description, priority, issues: m.issues };
    }
}