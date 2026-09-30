import {
  Body, Controller, Delete, DefaultValuePipe, Get, Param, ParseIntPipe, Patch, Post, Query,
} from '@nestjs/common';
import { AssetsService } from './assets.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { QueryAssetsDto } from './dto/query-assets.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) { }

  @Get()
  findAll(@Query() query: QueryAssetsDto) {
    return this.assetsService.findAll(query);
  }

  // rotas fixas (summary) sempre ANTES de ':id'
  @Get('summary')
  summary() {
    return this.assetsService.getSummary();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Get(':id/metrics')
  metrics(@Param('id') id: string) {
    return this.assetsService.getMetrics(id);
  }

  @Get(':id/history')
  history(
    @Param('id') id: string,
    @Query('range', new DefaultValuePipe(60), ParseIntPipe) range: number,
    @Query('points', new DefaultValuePipe(30), ParseIntPipe) points: number,
  ) {
    return this.assetsService.getHistory(id, range, points);
  }

  @Post()
  create(@Body() dto: CreateAssetDto) {
    return this.assetsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
