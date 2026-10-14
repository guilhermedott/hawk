import {
    CanActivate, ExecutionContext, ForbiddenException, Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../auth/current-user.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CompanyContext } from './current-company.decorator.js';

@Injectable()
export class CompanyGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context
            .switchToHttp()
            .getRequest<Request & { user?: JwtPayload; company?: CompanyContext }>();

        const membership = req.user
            ? await this.prisma.membership.findUnique({ where: { userId: req.user.sub } })
            : null;

        if (!membership) {
            throw new ForbiddenException(
                'Crie uma empresa ou aguarde a aprovação para acessar este recurso',
            );
        }

        req.company = { companyId: membership.companyId, role: membership.role };
        return true;
    }
}