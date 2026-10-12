import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { MailService } from './mail.service.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly users: UsersService,
        private readonly jwt: JwtService,
        private readonly prisma: PrismaService,
        private readonly mail: MailService,
        private readonly config: ConfigService,
    ) { }

    async register(dto: RegisterDto) {
        if (await this.users.findByEmail(dto.email)) {
            throw new ConflictException('Já existe uma conta com este e-mail');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.users.create({
            name: dto.name,
            email: dto.email,
            passwordHash,
        });
        return this.buildResponse(user);
    }

    async login(dto: LoginDto) {
        const user = await this.users.findByEmail(dto.email);
        const valid = user && (await bcrypt.compare(dto.password, user.passwordHash));
        // mensagem genérica: não revela se foi o e-mail ou a senha que errou
        if (!user || !valid) {
            throw new UnauthorizedException('E-mail ou senha inválidos');
        }
        return this.buildResponse(user);
    }

    async forgotPassword(email: string) {
        const user = await this.users.findByEmail(email);
        if (!user) {
            return {
                message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.',
            };
        }

        const token = randomBytes(32).toString('hex');
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        await this.prisma.$transaction(async (tx) => {
            await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
            await tx.passwordResetToken.create({
                data: { tokenHash, userId: user.id, expiresAt },
            });
        });

        const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
        const resetUrl = new URL('/reset-password', frontendUrl);
        resetUrl.searchParams.set('token', token);
        await this.mail.sendPasswordReset(user.email, resetUrl.toString());

        return {
            message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.',
        };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const tokenHash = createHash('sha256').update(dto.token).digest('hex');
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: { tokenHash },
        });

        if (!resetToken || resetToken.expiresAt <= new Date()) {
            throw new BadRequestException('Token inválido ou expirado');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);
        await this.prisma.$transaction(async (tx) => {
            const { count } = await tx.passwordResetToken.deleteMany({
                where: { tokenHash, expiresAt: { gt: new Date() } },
            });
            if (count !== 1) {
                throw new BadRequestException('Token inválido ou expirado');
            }

            await tx.user.update({
                where: { id: resetToken.userId },
                data: { passwordHash },
            });
            await tx.passwordResetToken.deleteMany({
                where: { userId: resetToken.userId },
            });
        });

        return { message: 'Senha redefinida com sucesso' };
    }

    async me(userId: string) {
        const user = await this.users.findById(userId);
        if (!user) throw new UnauthorizedException('Usuário não encontrado');
        return this.toPublic(user);
    }

    private async buildResponse(user: User) {
        const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
        return { accessToken, user: this.toPublic(user) };
    }

    // nunca devolve o hash da senha
    private toPublic(user: User) {
        return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
    }
}