import { Controller, Get, Query } from '@nestjs/common';
import { IsIn, IsOptional } from 'class-validator';
import { AlertsService } from './alerts.service.js';

class QueryAlertsDto {
    @IsOptional()
    @IsIn(['warning', 'critical'])
    level?: 'warning' | 'critical';
}

@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) { }

    @Get()
    findAll(@Query() query: QueryAlertsDto) {
        return this.alertsService.findAll(query.level);
    }
}