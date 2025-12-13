/**
 * TradeNexus Backend - 根模块
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { SourcingModule } from './modules/sourcing/sourcing.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AiModule } from './modules/ai/ai.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { AmazonModule } from './modules/amazon/amazon.module';
import { MemoryModule } from './modules/memory/memory.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // 环境变量配置
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '../.env'],
    }),

    // 数据库
    PrismaModule,

    // 业务模块
    AuthModule,
    ProductsModule,
    SourcingModule,
    ComplianceModule,
    AiModule,
    JobsModule,
    AmazonModule,
    MemoryModule, // Titans 长期记忆系统
  ],
  controllers: [HealthController],
})
export class AppModule {}
