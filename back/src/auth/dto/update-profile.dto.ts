import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty({ message: 'O nome é obrigatório' })
    @MaxLength(80)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(300_000)
    @Matches(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, {
        message: 'A foto deve ser uma imagem JPEG, PNG ou WebP válida',
    })
    avatarDataUrl: string | null;
}
