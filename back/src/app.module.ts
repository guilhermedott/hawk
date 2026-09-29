import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AssetsModule } from './assets/assets.module.js';

@Module({
  imports: [AssetsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
