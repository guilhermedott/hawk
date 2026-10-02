import {
    ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { CreateJoinRequestDto } from './dto/create-join-request.dto.js';

const toKey = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();
const isUniqueError = (e: unknown) =>
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

@Injectable()
export class CompaniesService {
    constructor(private readonly prisma: PrismaService) { }

    // ---------- helpers ----------
    private async requireMembership(userId: string) {
        const membership = await this.prisma.membership.findUnique({ where: { userId } });
        if (!membership) {
            throw new ForbiddenException('Você não pertence a nenhuma empresa');
        }
        return membership;
    }

    private async requireOwner(userId: string) {
        const membership = await this.requireMembership(userId);
        if (membership.role !== 'owner') {
            throw new ForbiddenException('Apenas o dono da empresa pode fazer isso');
        }
        return membership;
    }

    private async assertNoCompany(userId: string) {
        const existing = await this.prisma.membership.findUnique({ where: { userId } });
        if (existing) throw new ConflictException('Você já pertence a uma empresa');
    }

    // ---------- usuário comum ----------
    async create(userId: string, dto: CreateCompanyDto) {
        await this.assertNoCompany(userId);
        try {
            // se o usuário tinha um pedido pendente, ele é descartado
            const [, company] = await this.prisma.$transaction([
                this.prisma.joinRequest.deleteMany({ where: { userId, status: 'pending' } }),
                this.prisma.company.create({
                    data: {
                        name: dto.name,
                        nameKey: toKey(dto.name),
                        memberships: { create: { userId, role: 'owner' } },
                    },
                }),
            ]);
            return { id: company.id, name: company.name, role: 'owner' as const };
        } catch (e) {
            if (isUniqueError(e)) {
                throw new ConflictException('Já existe uma empresa com este nome');
            }
            throw e;
        }
    }

    async getMine(userId: string) {
        const membership = await this.prisma.membership.findUnique({
            where: { userId },
            include: { company: true },
        });
        const pending = await this.prisma.joinRequest.findFirst({
            where: { userId, status: 'pending' },
            include: { company: { select: { name: true } } },
        });

        // o front usa este endpoint para decidir se mostra o dashboard ou a tela de "criar/entrar"
        return {
            company: membership
                ? { id: membership.company.id, name: membership.company.name }
                : null,
            role: membership?.role ?? null,
            pendingRequest: pending
                ? { id: pending.id, companyName: pending.company.name, createdAt: pending.createdAt }
                : null,
        };
    }

    async requestJoin(userId: string, dto: CreateJoinRequestDto) {
        await this.assertNoCompany(userId);

        const company = await this.prisma.company.findUnique({
            where: { nameKey: toKey(dto.companyName) },
        });
        if (!company) throw new NotFoundException('Empresa não encontrada');

        const pending = await this.prisma.joinRequest.findFirst({
            where: { userId, status: 'pending' },
        });
        if (pending) {
            throw new ConflictException(
                'Você já tem uma solicitação pendente. Cancele-a para pedir outra',
            );
        }

        const request = await this.prisma.joinRequest.create({
            data: { userId, companyId: company.id },
        });
        return { id: request.id, status: request.status, companyName: company.name };
    }

    async cancelMyRequest(userId: string) {
        const { count } = await this.prisma.joinRequest.deleteMany({
            where: { userId, status: 'pending' },
        });
        if (count === 0) throw new NotFoundException('Nenhuma solicitação pendente');
        return { cancelled: true };
    }

    // ---------- membros da empresa ----------
    async listMembers(userId: string) {
        const { companyId } = await this.requireMembership(userId);
        const members = await this.prisma.membership.findMany({
            where: { companyId },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'asc' },
        });
        return members.map((m) => ({
            userId: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.createdAt,
        }));
    }

    // ---------- somente o dono ----------
    async listJoinRequests(userId: string) {
        const { companyId } = await this.requireOwner(userId);
        const requests = await this.prisma.joinRequest.findMany({
            where: { companyId, status: 'pending' },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'asc' },
        });
        return requests.map((r) => ({
            id: r.id,
            createdAt: r.createdAt,
            user: r.user,
        }));
    }

    async resolveJoinRequest(
        userId: string,
        requestId: string,
        status: 'approved' | 'rejected',
    ) {
        const owner = await this.requireOwner(userId);

        // filtrar por companyId impede o dono de uma empresa mexer em pedidos de outra
        const request = await this.prisma.joinRequest.findFirst({
            where: { id: requestId, companyId: owner.companyId, status: 'pending' },
        });
        if (!request) {
            throw new NotFoundException('Solicitação não encontrada ou já resolvida');
        }

        const update = this.prisma.joinRequest.update({
            where: { id: request.id },
            data: { status, resolvedAt: new Date() },
        });

        try {
            if (status === 'approved') {
                await this.prisma.$transaction([
                    update,
                    this.prisma.membership.create({
                        data: { userId: request.userId, companyId: owner.companyId, role: 'member' },
                    }),
                ]);
            } else {
                await update;
            }
        } catch (e) {
            if (isUniqueError(e)) {
                throw new ConflictException('Este usuário já pertence a uma empresa');
            }
            throw e;
        }

        return { id: request.id, status };
    }
}