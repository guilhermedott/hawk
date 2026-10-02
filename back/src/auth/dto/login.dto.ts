import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    @IsEmail({}, { message: 'Informe um e-mail válido' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'A senha é obrigatória' })
    password: string;
}