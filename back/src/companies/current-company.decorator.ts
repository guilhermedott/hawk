import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CompanyContext {
    companyId: string;
    role: 'owner' | 'member';
}

export const CurrentCompany = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): CompanyContext =>
        ctx.switchToHttp().getRequest().company,
);