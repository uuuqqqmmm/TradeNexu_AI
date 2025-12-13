import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MemoryService } from './memory.service';

@ApiTags('memory')
@Controller('memory')
export class MemoryController {
  constructor(private memoryService: MemoryService) {}

  // ============================================
  // 报价管理 (事实记忆)
  // ============================================

  @Post('quote')
  @ApiOperation({ summary: '保存报价信息' })
  async saveQuote(@Body() data: {
    itemType: 'product' | 'freight' | 'service';
    itemName: string;
    price: number;
    currency?: string;
    unit?: string;
    route?: string;
    terms?: string;
    supplierId?: string;
    validityDays?: number;
    source?: string;
    metadata?: any;
  }) {
    return this.memoryService.saveQuote(data);
  }

  @Get('quotes')
  @ApiOperation({ summary: '查询有效报价' })
  async getQuotes(
    @Query('itemType') itemType?: string,
    @Query('route') route?: string,
    @Query('limit') limit?: string,
  ) {
    return this.memoryService.getValidQuotes({
      itemType,
      route,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('quotes/prune')
  @ApiOperation({ summary: '清理过期报价' })
  async pruneQuotes() {
    const count = await this.memoryService.pruneExpiredQuotes();
    return { pruned: count };
  }

  // ============================================
  // 知识库管理 (语义记忆)
  // ============================================

  @Post('knowledge')
  @ApiOperation({ summary: '保存知识块' })
  async saveKnowledge(@Body() data: {
    category: 'regulation' | 'contract' | 'product_spec' | 'tariff';
    country?: string;
    title: string;
    content: string;
    source?: string;
    version?: string;
    metadata?: any;
  }) {
    return this.memoryService.saveKnowledge(data);
  }

  @Get('knowledge/search')
  @ApiOperation({ summary: '搜索知识库' })
  async searchKnowledge(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('country') country?: string,
    @Query('limit') limit?: string,
  ) {
    return this.memoryService.searchKnowledge(query, {
      category,
      country,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // ============================================
  // 对话记忆
  // ============================================

  @Post('conversation')
  @ApiOperation({ summary: '保存对话摘要' })
  async saveConversation(@Body() data: {
    userId: string;
    sessionId?: string;
    summary: string;
    keyEntities: Record<string, any>;
    userPreferences?: Record<string, any>;
    actionItems?: any[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    importance?: number;
  }) {
    return this.memoryService.saveConversationMemory(data);
  }

  @Get('conversation/:userId')
  @ApiOperation({ summary: '获取用户对话记忆' })
  async getUserMemories(
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.memoryService.getUserMemories(userId, limit ? parseInt(limit) : undefined);
  }

  // ============================================
  // 关系图谱 (关联记忆)
  // ============================================

  @Post('relation')
  @ApiOperation({ summary: '保存实体关系' })
  async saveRelation(@Body() data: {
    fromType: string;
    fromId: string;
    fromName: string;
    relationType: string;
    toType: string;
    toId: string;
    toName: string;
    properties?: Record<string, any>;
    confidence?: number;
    source?: string;
  }) {
    return this.memoryService.saveRelation(data);
  }

  @Get('graph/traverse')
  @ApiOperation({ summary: '图谱遍历查询' })
  async traverseGraph(
    @Query('type') type: string,
    @Query('id') id?: string,
    @Query('name') name?: string,
    @Query('relation') relation?: string,
    @Query('depth') depth?: string,
  ) {
    return this.memoryService.traverseGraph(
      { type, id, name },
      relation,
      depth ? parseInt(depth) : 1
    );
  }

  @Get('suppliers/capability')
  @ApiOperation({ summary: '查找具有特定能力的供应商' })
  async findSuppliersByCapability(@Query('capability') capability: string) {
    return this.memoryService.findSuppliersWithCapability(capability);
  }

  // ============================================
  // 混合检索
  // ============================================

  @Post('search/hybrid')
  @ApiOperation({ summary: '混合检索 - 同时查询事实、语义、关联记忆' })
  async hybridSearch(@Body() data: {
    query: string;
    userId?: string;
    country?: string;
    productType?: string;
    route?: string;
  }) {
    const memories = await this.memoryService.hybridSearch(data.query, data);
    const context = this.memoryService.assembleMemoryContext(memories);
    return {
      memories,
      assembledContext: context,
    };
  }

  // ============================================
  // 统计信息
  // ============================================

  @Get('stats')
  @ApiOperation({ summary: '获取记忆统计信息' })
  async getStats() {
    return this.memoryService.getMemoryStats();
  }
}
