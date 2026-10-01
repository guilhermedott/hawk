import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly users: UsersService,
        private readonly jwt: JwtService,
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