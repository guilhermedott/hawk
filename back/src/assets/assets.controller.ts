import {
  Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseIntPipe, Patch, Post,
  Query, UseGuards,
} from '@nestjs/common';
import { CompanyGuard } from '../companies/company.guard.js';
import { CurrentCompany, type CompanyContext } from '../companies/current-company.decorator.js';
import { AssetsService } from './assets.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { QueryAssetsDto } from './dto/query-assets.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';

@UseGuards(CompanyGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) { }

  @Get()
  findAll(@CurrentCompany() ctx: CompanyContext, @Query() query: QueryAssetsDto) {
    return this.assetsService.findAll(ctx.companyId, query);
  }

  // rotas fixas (summary) sempre ANTES de ':id'
  @Get('summary')
  summary(@CurrentCompany() ctx: CompanyContext) {
    return this.assetsService.getSummary(ctx.companyId);
  }

  @Get(':id')
  findOne(@CurrentCompany() ctx: CompanyContext, @Param('id') id: string) {
    return this.assetsService.findOne(ctx.companyId, id);
  }

  @Get(':id/metrics')
  metrics(@CurrentCompany() ctx: CompanyContext, @Param('id') id: string) {
    return this.assetsService.getMetrics(ctx.companyId, id);
  }

  @Get(':id/history')
  history(
    @CurrentCompany() ctx: CompanyContext,
    @Param('id') id: string,
    @Query('range', new DefaultValuePipe(60), ParseIntPipe) range: number,
    @Query('points', new DefaultValuePipe(30), ParseIntPipe) points: number,
  ) {
    return this.assetsService.getHistory(ctx.companyId, id, range, points);
  }

  @Post()
  create(@CurrentCompany() ctx: CompanyContext, @Body() dto: CreateAssetDto) {
    return this.assetsService.create(ctx.companyId, dto);
  }

  @Patch(':id')
  update(
    @CurrentCompany() ctx: CompanyContext,
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetsService.update(ctx.companyId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentCompany() ctx: CompanyContext, @Param('id') id: string) {
    return this.assetsService.remove(ctx.companyId, id);
  }
}
