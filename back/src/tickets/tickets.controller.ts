import {
    Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '../auth/current-user.decorator.js';
import { CompanyGuard } from '../companies/company.guard.js';
import { CurrentCompany, type CompanyContext } from '../companies/current-company.decorator.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { QueryTicketsDto } from './dto/query-tickets.dto.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { TicketsService } from './tickets.service.js';

@UseGuards(CompanyGuard)
@Controller('tickets')
export class TicketsController {
    constructor(private readonly tickets: TicketsService) { }

    @Get()
    findAll(@CurrentCompany() ctx: CompanyContext, @Query() query: QueryTicketsDto) {
        return this.tickets.findAll(ctx.companyId, query);
    }

    @Get('summary')
    summary(@CurrentCompany() ctx: CompanyContext) {
        return this.tickets.getSummary(ctx.companyId);
    }

    @Get('draft')
    draft(
        @CurrentCompany() ctx: CompanyContext,
        @Query('assetId', new ParseUUIDPipe()) assetId: string,
    ) {
        return this.tickets.getDraft(ctx.companyId, assetId);
    }

    @Get(':id')
    findOne(@CurrentCompany() ctx: CompanyContext, @Param('id') id: string) {
        return this.tickets.findOne(ctx.companyId, id);
    }

    @Post()
    create(
        @CurrentCompany() ctx: CompanyContext,
        @CurrentUser() user: JwtPayload,
        @Body() dto: CreateTicketDto,
    ) {
        return this.tickets.create(ctx.companyId, user.sub, dto);
    }

    @Patch(':id')
    update(
        @CurrentCompany() ctx: CompanyContext,
        @Param('id') id: string,
        @Body() dto: UpdateTicketDto,
    ) {
        return this.tickets.update(ctx.companyId, id, dto);
    }

    @Delete(':id')
    remove(@CurrentCompany() ctx: CompanyContext, @Param('id') id: string) {
        return this.tickets.remove(ctx.companyId, ctx.role, id);
    }
}