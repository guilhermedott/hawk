import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AssetsModule } from './assets/assets.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AlertsModule } from './alerts/alerts.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ConfigModule } from '@nestjs/config';
import { CompaniesModule } from './companies/companies.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AssetsModule, PrismaModule, AlertsModule, UsersModule, AuthModule, CompaniesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
