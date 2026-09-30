import { AssetType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value;

export class CreateAssetDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
    @IsString()
    @Matches(/^[A-Z0-9-]{3,30}$/, {
        message: 'A tag deve ter de 3 a 30 caracteres (letras, números e hífen)',
    })
    tag: string;

    @Transform(trim)
    @IsString()
    @IsNotEmpty({ message: 'O nome é obrigatório' })
    @MaxLength(60)
    name: string;

    @IsEnum(AssetType, { message: 'Tipo inválido' })
    type: AssetType;

    @Transform(trim)
    @IsString()
    @IsNotEmpty({ message: 'O setor é obrigatório' })
    @MaxLength(60)
    department: string;

    @Transform(trim)
    @IsString()
    @IsNotEmpty({ message: 'O responsável é obrigatório' })
    @MaxLength(60)
    responsible: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(255)
    notes?: string;
}