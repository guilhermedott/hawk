import { IsIn } from 'class-validator';

export class ResolveJoinRequestDto {
    @IsIn(['approved', 'rejected'], {
        message: 'O status deve ser "approved" ou "rejected"',
    })
    status: 'approved' | 'rejected';
}