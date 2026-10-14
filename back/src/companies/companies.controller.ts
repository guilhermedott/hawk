import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '../auth/current-user.decorator.js';
import { CompaniesService } from './companies.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { CreateJoinRequestDto } from './dto/create-join-request.dto.js';
import { ResolveJoinRequestDto } from './dto/resolve-join-request.dto.js';

@Controller('companies')
export class CompaniesController {
    constructor(private readonly companies: CompaniesService) { }

    @Post()
    create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCompanyDto) {
        return this.companies.create(user.sub, dto);
    }

    @Get('me')
    me(@CurrentUser() user: JwtPayload) {
        return this.companies.getMine(user.sub);
    }

    @Get('me/members')
    members(@CurrentUser() user: JwtPayload) {
        return this.companies.listMembers(user.sub);
    }

    @Get('me/join-requests')
    joinRequests(@CurrentUser() user: JwtPayload) {
        return this.companies.listJoinRequests(user.sub);
    }

    @Patch('me/join-requests/:id')
    resolve(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() dto: ResolveJoinRequestDto,
    ) {
        return this.companies.resolveJoinRequest(user.sub, id, dto.status);
    }

    @Post('join-requests')
    requestJoin(@CurrentUser() user: JwtPayload, @Body() dto: CreateJoinRequestDto) {
        return this.companies.requestJoin(user.sub, dto);
    }

    @Delete('join-requests/mine')
    cancelRequest(@CurrentUser() user: JwtPayload) {
        return this.companies.cancelMyRequest(user.sub);
    }
}