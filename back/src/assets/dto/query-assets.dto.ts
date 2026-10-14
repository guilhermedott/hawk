import { AssetStatus, AssetType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryAssetsDto {
    @IsOptional() @IsEnum(AssetType) type?: AssetType;
    @IsOptional() @IsEnum(AssetStatus) status?: AssetStatus;
    @IsOptional() @IsString() search?: string;
}