import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty({ message: 'O nome é obrigatório' })
    @MaxLength(80)
    name: string;

    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    @IsEmail({}, { message: 'Informe um e-mail válido' })
    email: string;

    @IsString()
    @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
    @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres' })
    @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
        message: 'A senha deve conter letras e números',
    })
    password: string;
}