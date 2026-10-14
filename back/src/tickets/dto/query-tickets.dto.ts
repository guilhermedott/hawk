import { TicketPriority, TicketStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryTicketsDto {
    @IsOptional() @IsEnum(TicketStatus) status?: TicketStatus;
    @IsOptional() @IsEnum(TicketPriority) priority?: TicketPriority;
    @IsOptional() @IsUUID('all') assetId?: string;
    @IsOptional() @IsUUID('all') assignedToId?: string;
    @IsOptional() @IsString() search?: string;
}