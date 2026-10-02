import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional } from 'class-validator';
import { CompanyGuard } from '../companies/company.guard.js';
import { CurrentCompany, type CompanyContext } from '../companies/current-company.decorator.js';
import { AlertsService } from './alerts.service.js';

class QueryAlertsDto {
    @IsOptional()
    @IsIn(['warning', 'critical'])
    level?: 'warning' | 'critical';
}

@UseGuards(CompanyGuard)
@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) { }

    @Get()
    findAll(@CurrentCompany() ctx: CompanyContext, @Query() query: QueryAlertsDto) {
        return this.alertsService.findAll(ctx.companyId, query.level);
    }
}