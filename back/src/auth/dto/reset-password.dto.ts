import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/i, { message: 'Token de recuperação inválido' })
  token: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'A senha deve conter letras e números',
  })
  password: string;
}
