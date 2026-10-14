import { OmitType, PartialType } from '@nestjs/mapped-types';
import { TicketStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CreateTicketDto } from './create-ticket.dto.js';

export class UpdateTicketDto extends PartialType(OmitType(CreateTicketDto, ['assetId'] as const)) {
    @IsOptional()
    @IsEnum(TicketStatus, { message: 'Status inválido' })
    status?: TicketStatus;

    // IsOptional também aceita null, que significa "remover o responsável"
    @IsOptional()
    @IsUUID('all', { message: 'Responsável inválido' })
    assignedToId?: string | null;
}