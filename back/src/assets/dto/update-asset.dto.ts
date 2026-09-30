import { OmitType, PartialType } from '@nestjs/mapped-types';
import { AssetStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateAssetDto } from './create-asset.dto.js';

export class UpdateAssetDto extends PartialType(
    OmitType(CreateAssetDto, ['type', 'tag'] as const),
) {
    @IsOptional()
    @IsEnum(AssetStatus, { message: 'Status inválido' })
    status?: AssetStatus;
}