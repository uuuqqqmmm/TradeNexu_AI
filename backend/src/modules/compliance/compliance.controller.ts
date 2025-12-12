/**
 * 合规检查控制器
 */

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('compliance')
@Controller('compliance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  @Post('check/:productId')
  @ApiOperation({ summary: '检查产品合规性' })
  async checkCompliance(
    @Param('productId') productId: string,
    @Body() data: { market: string; category: string },
  ) {
    return this.complianceService.checkCompliance(productId, data.market, data.category);
  }

  @Get('results/:productId')
  @ApiOperation({ summary: '获取合规检查记录' })
  async getComplianceChecks(@Param('productId') productId: string) {
    return this.complianceService.getComplianceChecks(productId);
  }

  @Post('hs-code')
  @ApiOperation({ summary: '匹配 HS 编码' })
  async matchHsCode(@Body() data: { description: string; market: string }) {
    return this.complianceService.matchHsCode(data.description, data.market);
  }
}
