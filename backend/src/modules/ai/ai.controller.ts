/**
 * AI 分析控制器
 */

import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('analyze')
  @ApiOperation({ summary: '产品市场分析' })
  async analyzeProduct(@Body() data: { query: string; context?: any }) {
    return this.aiService.analyzeProduct(data.query, data.context);
  }

  @Post('translate')
  @ApiOperation({ summary: '翻译为中文搜索词' })
  async translateToSearchTerms(@Body() data: { title: string }) {
    return this.aiService.translateToSearchTerms(data.title);
  }

  @Post('workflow/replication')
  @ApiOperation({ summary: '一键爆款复刻工作流' })
  async runReplicationWorkflow(@Request() req, @Body() data: { amazonUrl: string }) {
    return this.aiService.runReplicationWorkflow(data.amazonUrl, req.user.sub);
  }
}
