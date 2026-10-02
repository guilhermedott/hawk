import { TicketPriority } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value;

export class CreateTicketDto {
    @IsUUID('all', { message: 'Selecione um ativo válido' })
    assetId: string;

    @Transform(trim)
    @IsString()
    @IsNotEmpty({ message: 'O título é obrigatório' })
    @MinLength(3, { message: 'O título deve ter pelo menos 3 caracteres' })
    @MaxLength(100, { message: 'O título deve ter no máximo 100 caracteres' })
    title: string;

    @Transform(trim)
    @IsString()
    @IsNotEmpty({ message: 'A descrição é obrigatória' })
    @MinLength(10, { message: 'Descreva o problema com pelo menos 10 caracteres' })
    @MaxLength(1000, { message: 'A descrição deve ter no máximo 1000 caracteres' })
    description: string;

    @IsEnum(TicketPriority, { message: 'Prioridade inválida' })
    priority: TicketPriority;
}