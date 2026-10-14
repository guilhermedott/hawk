import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import type { JwtPayload } from './current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Public()
    @HttpCode(200)
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('me')
    me(@CurrentUser() user: JwtPayload) {
        return this.authService.me(user.sub);
    }

    @Patch('me')
    updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
        return this.authService.updateProfile(user.sub, dto);
    }
}