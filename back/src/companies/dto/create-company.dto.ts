import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCompanyDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty({ message: 'O nome da empresa é obrigatório' })
    @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres' })
    @MaxLength(80)
    name: string;
}
