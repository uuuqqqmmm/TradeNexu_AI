/**
 * 健康检查控制器
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: '健康检查' })
  async check() {
    return {
      status: 'ok',
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      database: this.prisma.connected ? 'connected' : 'disconnected',
      services: {
        api: 'running',
        auth: 'ready',
        products: 'ready',
        sourcing: 'ready',
        compliance: 'ready',
        ai: 'ready',
        jobs: 'ready',
      },
    };
  }

  @Get('db')
  @ApiOperation({ summary: '数据库连接检查' })
  async checkDatabase() {
    if (!this.prisma.connected) {
      return {
        status: 'disconnected',
        message: '数据库未连接，运行在离线模式',
      };
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'connected',
        message: '数据库连接正常',
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}
