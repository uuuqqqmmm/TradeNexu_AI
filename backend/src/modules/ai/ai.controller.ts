/**
 * AI 分析控制器
 * 提供对话、搜索、分析等 AI 服务
 */

import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  // 公开接口 - 智能 AI 对话（支持实时信息获取）
  @Post('chat')
  @ApiOperation({ summary: 'AI 智能对话 - 支持天气等实时信息' })
  async chat(@Body() data: { 
    query: string; 
    history?: { role: string; content: string }[]; 
    provider?: 'deepseek' | 'gemini' | 'openrouter'; 
    model?: string;
    webSearchMode?: 'auto' | 'on' | 'off';
  }) {
    // 使用 smartChat，支持联网搜索模式控制
    return this.aiService.smartChat(data.query, data.history || [], data.model, data.webSearchMode);
  }

  // 获取天气信息
  @Get('weather')
  @ApiOperation({ summary: '获取指定城市天气' })
  async getWeather(@Body() data: { location: string }) {
    return this.aiService.getWeather(data.location);
  }

  // 获取可用模型列表
  @Get('models')
  @ApiOperation({ summary: '获取可用 AI 模型列表' })
  getAvailableModels() {
    return this.aiService.getAvailableModels();
  }

  // 获取当前模型
  @Get('models/current')
  @ApiOperation({ summary: '获取当前选中的模型' })
  getCurrentModel() {
    return this.aiService.getCurrentModel();
  }

  // 设置当前模型
  @Post('models/current')
  @ApiOperation({ summary: '设置当前使用的模型' })
  setCurrentModel(@Body() data: { model: string }) {
    const success = this.aiService.setCurrentModel(data.model);
    return { success, model: data.model };
  }

  // 简单对话 - 无结构化输出
  @Post('simple-chat')
  @ApiOperation({ summary: '简单对话 - 自然语言回复' })
  async simpleChat(@Body() data: { message: string; history?: { role: string; content: string }[] }) {
    return this.aiService.simpleChat(data.message, data.history || []);
  }

  // 网络搜索
  @Post('search')
  @ApiOperation({ summary: '网络资料搜索' })
  async webSearch(@Body() data: { query: string; maxResults?: number; language?: string }) {
    return this.aiService.webSearch(data.query, { maxResults: data.maxResults, language: data.language });
  }

  // 获取服务状态
  @Get('status')
  @ApiOperation({ summary: '获取 AI 服务状态' })
  getServiceStatus() {
    return this.aiService.getServiceStatus();
  }

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  // 3.5.11: 自动记忆提取 API
  @Post('memory/extract')
  @ApiOperation({ summary: '从对话历史中提取并保存记忆' })
  async extractMemory(@Body() data: { 
    userId: string;
    sessionId: string;
    history: { role: string; content: string }[];
  }) {
    // 检查是否应该保存
    if (!this.aiService.shouldSaveMemory(data.history)) {
      return { saved: false, reason: '对话内容不足或无外贸相关内容' };
    }
    return this.aiService.extractAndSaveMemory(data.userId, data.sessionId, data.history);
  }
}
