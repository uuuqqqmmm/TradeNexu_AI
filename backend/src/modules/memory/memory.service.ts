import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Titans 长期记忆服务
 * 实现三脑模型：事实记忆(SQL) + 语义记忆(Vector) + 关联记忆(Graph)
 */
@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(private prisma: PrismaService) {
    this.logger.log('🧠 Titans Memory Service initialized');
  }

  // ============================================
  // 事实记忆 (Factual Memory) - 报价管理
  // ============================================

  /**
   * 保存报价信息 (带 TTL 时效性)
   */
  async saveQuote(data: {
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
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (data.validityDays || 30));

    // 检查是否存在冲突的有效报价
    const existing = await this.prisma.quote.findFirst({
      where: {
        supplierId: data.supplierId || null,
        itemName: data.itemName,
        itemType: data.itemType,
        isDeprecated: false,
        validUntil: { gt: new Date() }
      }
    });

    if (existing) {
      // 标记旧报价为过期 (记忆更新机制)
      await this.prisma.quote.update({
        where: { id: existing.id },
        data: { isDeprecated: true }
      });
      this.logger.log(`📝 旧报价已标记过期: ${existing.id}`);
    }

    const quote = await this.prisma.quote.create({
      data: {
        itemType: data.itemType,
        itemName: data.itemName,
        price: data.price,
        currency: data.currency || 'USD',
        unit: data.unit,
        route: data.route,
        terms: data.terms,
        supplierId: data.supplierId,
        validUntil,
        source: data.source || 'memory_agent',
        metadata: data.metadata,
      }
    });

    this.logger.log(`✅ 新报价已保存: ${data.itemName} @ ${data.price} ${data.currency || 'USD'}`);
    return quote;
  }

  /**
   * 查询有效报价 (自动过滤过期数据 - TTL 机制)
   */
  async getValidQuotes(filters: {
    itemType?: string;
    route?: string;
    supplierId?: string;
    limit?: number;
  }) {
    return this.prisma.quote.findMany({
      where: {
        itemType: filters.itemType,
        route: filters.route ? { contains: filters.route } : undefined,
        supplierId: filters.supplierId,
        isDeprecated: false,
        validUntil: { gt: new Date() }, // TTL 过滤
      },
      orderBy: { price: 'asc' },
      take: filters.limit || 10,
      include: { supplier: true }
    });
  }

  /**
   * 清理过期报价 (记忆遗忘机制)
   */
  async pruneExpiredQuotes() {
    const result = await this.prisma.quote.updateMany({
      where: {
        validUntil: { lt: new Date() },
        isDeprecated: false,
      },
      data: { isDeprecated: true }
    });
    this.logger.log(`🧹 已清理 ${result.count} 条过期报价`);
    return result.count;
  }

  // ============================================
  // 语义记忆 (Semantic Memory) - 知识库
  // ============================================

  /**
   * 保存知识块 (法规/合同/产品说明)
   */
  async saveKnowledge(data: {
    category: 'regulation' | 'contract' | 'product_spec' | 'tariff';
    country?: string;
    title: string;
    content: string;
    source?: string;
    version?: string;
    metadata?: any;
  }) {
    // 检查是否存在相同标题的旧版本
    const existing = await this.prisma.knowledgeChunk.findFirst({
      where: {
        title: data.title,
        category: data.category,
        country: data.country,
        isDeprecated: false,
      }
    });

    if (existing && data.version && existing.version !== data.version) {
      // 标记旧版本为过期，记录替代关系
      await this.prisma.knowledgeChunk.update({
        where: { id: existing.id },
        data: { 
          isDeprecated: true,
          supersededBy: data.title + ' v' + data.version
        }
      });
      this.logger.log(`📝 旧知识已标记过期: ${existing.title} (${existing.version})`);
    }

    const knowledge = await this.prisma.knowledgeChunk.create({
      data: {
        category: data.category,
        country: data.country,
        title: data.title,
        content: data.content,
        source: data.source,
        version: data.version,
        metadata: data.metadata,
        // embedding 需要单独调用向量化服务
      }
    });

    this.logger.log(`✅ 知识块已保存: ${data.title} [${data.category}]`);
    return knowledge;
  }

  /**
   * 搜索知识库 (基于关键词，后续可扩展为向量检索)
   */
  async searchKnowledge(query: string, filters?: {
    category?: string;
    country?: string;
    limit?: number;
  }) {
    return this.prisma.knowledgeChunk.findMany({
      where: {
        isDeprecated: false,
        category: filters?.category,
        country: filters?.country,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: filters?.limit || 5,
      orderBy: { createdAt: 'desc' }
    });
  }

  // ============================================
  // 对话记忆 (Conversation Memory)
  // ============================================

  /**
   * 保存对话摘要
   */
  async saveConversationMemory(data: {
    userId: string;
    sessionId?: string;
    summary: string;
    keyEntities: Record<string, any>;
    userPreferences?: Record<string, any>;
    actionItems?: any[];
    sentiment?: 'positive' | 'neutral' | 'negative';
    importance?: number;
  }) {
    const memory = await this.prisma.conversationMemory.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        summary: data.summary,
        keyEntities: data.keyEntities,
        userPreferences: data.userPreferences,
        actionItems: data.actionItems,
        sentiment: data.sentiment,
        importance: data.importance || 5,
        lastInteraction: new Date(),
      }
    });

    this.logger.log(`✅ 对话记忆已保存: ${data.summary.substring(0, 50)}...`);
    return memory;
  }

  /**
   * 获取用户的对话记忆 (按重要性和时间排序)
   */
  async getUserMemories(userId: string, limit: number = 10) {
    return this.prisma.conversationMemory.findMany({
      where: { userId },
      orderBy: [
        { importance: 'desc' },
        { lastInteraction: 'desc' }
      ],
      take: limit,
    });
  }

  // ============================================
  // 关联记忆 (Associative Memory) - 简化图谱
  // ============================================

  /**
   * 保存实体关系
   */
  async saveRelation(data: {
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
    // 检查是否存在相同关系
    const existing = await this.prisma.entityRelation.findFirst({
      where: {
        fromType: data.fromType,
        fromId: data.fromId,
        relationType: data.relationType,
        toType: data.toType,
        toId: data.toId,
      }
    });

    if (existing) {
      // 更新现有关系
      return this.prisma.entityRelation.update({
        where: { id: existing.id },
        data: {
          properties: data.properties,
          confidence: data.confidence,
        }
      });
    }

    const relation = await this.prisma.entityRelation.create({
      data: {
        fromType: data.fromType,
        fromId: data.fromId,
        fromName: data.fromName,
        relationType: data.relationType,
        toType: data.toType,
        toId: data.toId,
        toName: data.toName,
        properties: data.properties,
        confidence: data.confidence,
        source: data.source,
      }
    });

    this.logger.log(`✅ 关系已保存: ${data.fromName} --[${data.relationType}]--> ${data.toName}`);
    return relation;
  }

  /**
   * 图谱遍历查询
   */
  async traverseGraph(startEntity: { type: string; id?: string; name?: string }, relationType?: string, depth: number = 1) {
    const results: any[] = [];
    
    // 第一层查询
    const firstLevel = await this.prisma.entityRelation.findMany({
      where: {
        fromType: startEntity.type,
        fromId: startEntity.id,
        fromName: startEntity.name ? { contains: startEntity.name } : undefined,
        relationType: relationType,
      }
    });
    
    results.push(...firstLevel);

    // 如果需要更深层遍历
    if (depth > 1 && firstLevel.length > 0) {
      for (const rel of firstLevel) {
        const nextLevel = await this.traverseGraph(
          { type: rel.toType, id: rel.toId },
          undefined,
          depth - 1
        );
        results.push(...nextLevel);
      }
    }

    return results;
  }

  /**
   * 查找具有特定能力的供应商
   */
  async findSuppliersWithCapability(capability: string) {
    return this.prisma.supplierCapability.findMany({
      where: {
        capability: { contains: capability, mode: 'insensitive' },
        OR: [
          { validUntil: null },
          { validUntil: { gt: new Date() } }
        ]
      },
      include: { supplier: true }
    });
  }

  // ============================================
  // 混合检索 (Hybrid Search)
  // ============================================

  /**
   * 混合检索 - 同时查询事实、语义、关联记忆
   */
  async hybridSearch(query: string, context: {
    userId?: string;
    country?: string;
    productType?: string;
    route?: string;
  }) {
    const [quotes, knowledge, relations, userMemory] = await Promise.all([
      // 事实记忆：查询相关报价
      this.getValidQuotes({
        route: context.route,
        limit: 5
      }),
      
      // 语义记忆：搜索知识库
      this.searchKnowledge(query, {
        country: context.country,
        limit: 5
      }),
      
      // 关联记忆：查找相关实体关系
      context.productType ? this.prisma.entityRelation.findMany({
        where: {
          OR: [
            { fromName: { contains: context.productType, mode: 'insensitive' } },
            { toName: { contains: context.productType, mode: 'insensitive' } },
          ]
        },
        take: 10
      }) : [],
      
      // 用户记忆：获取用户偏好
      context.userId ? this.getUserMemories(context.userId, 3) : [],
    ]);

    return {
      factualMemory: this.formatQuotesContext(quotes),
      semanticMemory: this.formatKnowledgeContext(knowledge),
      graphMemory: this.formatRelationsContext(relations),
      userContext: this.formatUserMemoryContext(userMemory),
    };
  }

  /**
   * 组装增强 Prompt 上下文
   */
  assembleMemoryContext(memories: {
    factualMemory: string;
    semanticMemory: string;
    graphMemory: string;
    userContext: string;
  }): string {
    const parts: string[] = [];

    if (memories.factualMemory) {
      parts.push(`【长期记忆 - 事实数据】\n${memories.factualMemory}`);
    }
    if (memories.semanticMemory) {
      parts.push(`【长期记忆 - 法规知识】\n${memories.semanticMemory}`);
    }
    if (memories.graphMemory) {
      parts.push(`【长期记忆 - 关联信息】\n${memories.graphMemory}`);
    }
    if (memories.userContext) {
      parts.push(`【用户偏好记忆】\n${memories.userContext}`);
    }

    return parts.join('\n\n');
  }

  // 格式化辅助方法
  private formatQuotesContext(quotes: any[]): string {
    if (!quotes.length) return '';
    return quotes.map(q => 
      `• ${q.itemName}: ${q.price} ${q.currency} (${q.terms || 'N/A'}) - 有效期至 ${q.validUntil.toLocaleDateString()}`
    ).join('\n');
  }

  private formatKnowledgeContext(knowledge: any[]): string {
    if (!knowledge.length) return '';
    return knowledge.map(k => 
      `• [${k.category}] ${k.title}: ${k.content.substring(0, 200)}...`
    ).join('\n');
  }

  private formatRelationsContext(relations: any[]): string {
    if (!relations.length) return '';
    return relations.map(r => 
      `• ${r.fromName} --[${r.relationType}]--> ${r.toName}`
    ).join('\n');
  }

  private formatUserMemoryContext(memories: any[]): string {
    if (!memories.length) return '';
    return memories.map(m => 
      `• ${m.summary} (重要性: ${m.importance}/10)`
    ).join('\n');
  }

  // ============================================
  // Memory Manager Agent 工具函数
  // ============================================

  /**
   * 从文本中提取并保存记忆 (由 AI 调用)
   */
  async extractAndSaveMemory(text: string, extractedData: {
    type: 'quote' | 'regulation' | 'relation';
    data: any;
  }) {
    switch (extractedData.type) {
      case 'quote':
        return this.saveQuote(extractedData.data);
      case 'regulation':
        return this.saveKnowledge({
          category: 'regulation',
          ...extractedData.data
        });
      case 'relation':
        return this.saveRelation(extractedData.data);
      default:
        throw new Error(`Unknown memory type: ${extractedData.type}`);
    }
  }

  /**
   * 获取记忆统计信息
   */
  async getMemoryStats() {
    const [quoteCount, knowledgeCount, relationCount, memoryCount] = await Promise.all([
      this.prisma.quote.count({ where: { isDeprecated: false } }),
      this.prisma.knowledgeChunk.count({ where: { isDeprecated: false } }),
      this.prisma.entityRelation.count(),
      this.prisma.conversationMemory.count(),
    ]);

    return {
      factualMemory: { quotes: quoteCount },
      semanticMemory: { knowledgeChunks: knowledgeCount },
      associativeMemory: { relations: relationCount },
      conversationMemory: { summaries: memoryCount },
      totalMemories: quoteCount + knowledgeCount + relationCount + memoryCount,
    };
  }
}
