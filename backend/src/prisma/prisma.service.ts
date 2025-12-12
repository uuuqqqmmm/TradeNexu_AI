/**
 * Prisma 数据库服务
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('📦 Database connected');
    } catch (error: any) {
      this.logger.warn('⚠️ Database connection failed - running in offline mode');
      this.logger.warn(`   Reason: ${error.message}`);
      this.logger.warn('   To connect: 1) Start PostgreSQL  2) Set DATABASE_URL in .env');
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      this.logger.log('📦 Database disconnected');
    }
  }

  /**
   * 检查数据库是否连接
   */
  get connected(): boolean {
    return this.isConnected;
  }
}
