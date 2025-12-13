# TradeNexus AI - Titans 长期记忆系统实施计划

> 基于 Google Titans (MAC - Memory as Context) 研究理念，构建外贸领域的分层记忆架构

## 📋 项目现状分析

### 当前技术栈

- **后端**: NestJS + TypeScript + Prisma ORM
- **前端**: React + TypeScript + Vite
- **AI**: DeepSeek V3.1 + Function Calling + Tavily Search
- **数据库**: PostgreSQL (已配置，待连接)

### 已有数据模型

- `User` - 用户管理
- `Supplier` - 供应商收藏
- `Product` - 产品/选品数据
- `SourcingResult` - 供应链货源
- `ComplianceCheck` - 合规检查
- `KnowledgeEmbedding` - 知识向量存储 (已支持 pgvector)

### 待增强能力

- ❌ 时效性报价管理 (TTL 机制)
- ❌ 对话记忆摘要
- ❌ 知识图谱关联
- ❌ Memory Manager Agent
- ❌ 混合检索策略

---

## 🧠 三脑记忆模型设计

### 1. 事实记忆 (Factual Memory) - SQL

| 数据类型   | 存储内容             | 特点         |
| ---------- | -------------------- | ------------ |
| 报价数据   | SKU价格、运费、汇率  | 精确、有时效 |
| 供应商数据 | 信用评级、资质证书   | 结构化强     |
| 物流数据   | 航线、时效、限制品类 | 需要实时更新 |

### 2. 语义记忆 (Semantic Memory) - Vector

| 数据类型 | 存储内容           | 特点     |
| -------- | ------------------ | -------- |
| 法规文档 | 关税政策、认证要求 | 语义检索 |
| 合同条款 | 贸易条款、付款方式 | 模糊匹配 |
| 对话历史 | 用户偏好、关注领域 | 长期摘要 |

### 3. 关联记忆 (Associative Memory) - Graph

| 关系类型       | 示例                      |
| -------------- | ------------------------- |
| 供应商 → 产品 | A工厂 → 生产LED灯        |
| 产品 → 法规   | LED灯 → 需要CE认证       |
| 目的国 → 货代 | 德国 → B货代有危险品资质 |

---

## 📊 数据库 Schema 扩展设计

### Phase 1: 核心记忆表

```prisma
// ============================================
// Titans 长期记忆系统
// ============================================

// 时效性报价表 (事实记忆核心)
model Quote {
  id           String   @id @default(uuid())
  supplierId   String?  @map("supplier_id")
  itemType     String   @map("item_type")    // 'product', 'freight', 'service'
  itemName     String   @map("item_name")
  price        Decimal  @db.Decimal(10, 2)
  currency     String   @default("USD")
  unit         String?                        // 'per_kg', 'per_cbm', 'per_unit'
  route        String?                        // 'CN-DE', 'CN-US' (物流专用)
  terms        String?                        // 'FOB', 'CIF', 'EXW'
  validFrom    DateTime @default(now()) @map("valid_from")
  validUntil   DateTime @map("valid_until")   // TTL 过期时间
  isDeprecated Boolean  @default(false) @map("is_deprecated")
  source       String?                        // 'user_input', 'search_rag', 'api'
  metadata     Json?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([itemType, validUntil])
  @@index([route, validUntil])
  @@map("quotes")
}

// 知识块表 (语义记忆 - 增强版)
model KnowledgeChunk {
  id           String                       @id @default(uuid())
  category     String                       // 'regulation', 'contract', 'product_spec'
  country      String?                      // 'US', 'DE', 'CN'
  title        String
  content      String
  embedding    Unsupported("vector(1536)")?
  source       String?                      // 来源URL或文件名
  version      String?                      // '2024', '2025'
  isDeprecated Boolean  @default(false) @map("is_deprecated")
  supersededBy String?  @map("superseded_by") // 被哪个新版本替代
  metadata     Json?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([category, country])
  @@index([isDeprecated])
  @@map("knowledge_chunks")
}

// 对话记忆摘要表 (长期交互记忆)
model ConversationMemory {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  sessionId       String?  @map("session_id")
  summary         String                     // AI 生成的摘要
  keyEntities     Json     @map("key_entities")  // {"focus_country": "DE", "focus_product": "LED"}
  userPreferences Json?    @map("user_preferences") // {"prefers_sea_freight": true}
  actionItems     Json?    @map("action_items")  // 待办事项
  sentiment       String?                    // 'positive', 'neutral', 'negative'
  importance      Int      @default(5)       // 1-10 重要性评分
  lastInteraction DateTime @map("last_interaction")
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([userId, lastInteraction])
  @@map("conversation_memories")
}

// 实体关系表 (关联记忆 - 简化版图谱)
model EntityRelation {
  id           String   @id @default(uuid())
  fromType     String   @map("from_type")    // 'supplier', 'product', 'country', 'forwarder'
  fromId       String   @map("from_id")
  fromName     String   @map("from_name")
  relationType String   @map("relation_type") // 'produces', 'requires', 'serves', 'has_certification'
  toType       String   @map("to_type")
  toId         String   @map("to_id")
  toName       String   @map("to_name")
  properties   Json?                         // 关系属性
  confidence   Decimal? @db.Decimal(3, 2)    // AI 提取的置信度
  source       String?                       // 数据来源
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([fromType, fromId])
  @@index([toType, toId])
  @@index([relationType])
  @@map("entity_relations")
}

// 供应商能力表 (扩展现有 Supplier)
model SupplierCapability {
  id             String   @id @default(uuid())
  supplierId     String   @map("supplier_id")
  capability     String                      // 'dangerous_goods', 'cold_chain', 'oversized'
  certification  String?                     // 'ISO9001', 'IATF16949'
  validUntil     DateTime? @map("valid_until")
  verifiedAt     DateTime? @map("verified_at")
  verifiedSource String?  @map("verified_source")
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([supplierId])
  @@index([capability])
  @@map("supplier_capabilities")
}
```

---

## 🔧 Memory Manager Agent 设计

### 核心职责

```
┌─────────────────────────────────────────────────────────┐
│                   Memory Manager Agent                   │
├─────────────────────────────────────────────────────────┤
│  1. Extract (提取)  - 从对话/搜索结果中提取结构化信息      │
│  2. Classify (分类) - 判断信息类型 (事实/语义/关系)       │
│  3. Store (存储)    - 写入对应的记忆层                   │
│  4. Update (更新)   - 检测冲突，标记过期数据             │
│  5. Prune (清理)    - 定期清理过期/低价值记忆            │
└─────────────────────────────────────────────────────────┘
```

### Function Calling 工具定义

```typescript
const MEMORY_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'save_quote',
      description: '保存报价信息到长期记忆',
      parameters: {
        type: 'object',
        properties: {
          item_type: { type: 'string', enum: ['product', 'freight', 'service'] },
          item_name: { type: 'string' },
          price: { type: 'number' },
          currency: { type: 'string', default: 'USD' },
          supplier: { type: 'string' },
          validity_days: { type: 'integer', default: 30 },
          terms: { type: 'string' },
          route: { type: 'string' }
        },
        required: ['item_type', 'item_name', 'price']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_regulation',
      description: '保存法规/政策信息到知识库',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string' },
          category: { type: 'string', enum: ['tariff', 'certification', 'restriction', 'labeling'] },
          title: { type: 'string' },
          content: { type: 'string' },
          effective_year: { type: 'string' }
        },
        required: ['country', 'category', 'title', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_relation',
      description: '保存实体关系到知识图谱',
      parameters: {
        type: 'object',
        properties: {
          from_entity: { type: 'string' },
          from_type: { type: 'string', enum: ['supplier', 'product', 'country', 'forwarder', 'certification'] },
          relation: { type: 'string', enum: ['produces', 'requires', 'serves', 'has_certification', 'restricts'] },
          to_entity: { type: 'string' },
          to_type: { type: 'string' }
        },
        required: ['from_entity', 'from_type', 'relation', 'to_entity', 'to_type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'summarize_conversation',
      description: '总结当前对话并存入长期记忆',
      parameters: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          key_entities: { type: 'object' },
          importance: { type: 'integer', minimum: 1, maximum: 10 }
        },
        required: ['summary', 'key_entities']
      }
    }
  }
];
```

---

## 🔍 混合检索策略 (Hybrid Search)

### 检索流程

```
用户问题: "我要发一批电池到德国，找谁最便宜，要注意什么？"
                    │
                    ▼
        ┌─────────────────────┐
        │   Query Analyzer    │ ← 分析问题类型和关键实体
        └─────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │  SQL    │ │ Vector  │ │  Graph  │
   │ Query   │ │ Search  │ │ Traverse│
   └─────────┘ └─────────┘ └─────────┘
        │           │           │
        ▼           ▼           ▼
   最低运费     法规文档     资质关联
   $1500/A公司   UN38.3要求   A公司无危品资质
                             B公司有危品资质
        │           │           │
        └───────────┴───────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │  Context Assembler  │ ← 组装增强 Prompt
        └─────────────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │     LLM Response    │
        └─────────────────────┘
```

### SQL 检索示例

```sql
-- 获取有效的德国航线运费报价
SELECT supplier_name, price, terms, valid_until
FROM quotes 
WHERE item_type = 'freight' 
  AND route LIKE '%DE%'
  AND valid_until > NOW()
  AND is_deprecated = false
ORDER BY price ASC 
LIMIT 5;
```

### Vector 检索示例

```sql
-- 语义搜索电池出口德国相关法规
SELECT title, content, country
FROM knowledge_chunks
WHERE is_deprecated = false
  AND country IN ('DE', 'EU')
ORDER BY embedding <-> '[query_embedding]'::vector
LIMIT 5;
```

### Graph 检索示例

```sql
-- 查找有危险品资质的货代
SELECT DISTINCT to_name as forwarder_name
FROM entity_relations
WHERE relation_type = 'has_certification'
  AND to_type = 'forwarder'
  AND from_name = 'dangerous_goods_license';
```

---

## 📅 实施路线图

### 🚀 Phase 1: 基础设施 (Week 1-2)

#### 1.1 数据库部署

- [ ] 安装 PostgreSQL 15+
- [ ] 安装 pgvector 扩展
- [ ] 配置 DATABASE_URL 环境变量
- [ ] 执行 Prisma 迁移

#### 1.2 Schema 扩展

- [ ] 添加 Quote 模型
- [ ] 添加 KnowledgeChunk 模型
- [ ] 添加 ConversationMemory 模型
- [ ] 添加 EntityRelation 模型

#### 1.3 基础服务

- [ ] 创建 MemoryService 模块
- [ ] 实现基本 CRUD 操作
- [ ] 实现 TTL 过期检查

### 🧠 Phase 2: Memory Agent 开发 (Week 3)

#### 2.1 信息提取器

- [ ] 实现 QuoteExtractor (从对话提取报价)
- [ ] 实现 RegulationExtractor (从搜索结果提取法规)
- [ ] 实现 RelationExtractor (提取实体关系)

#### 2.2 记忆写入

- [ ] 实现 save_quote Function
- [ ] 实现 save_regulation Function
- [ ] 实现 save_relation Function
- [ ] 实现 summarize_conversation Function

#### 2.3 冲突检测与更新

- [ ] 实现报价冲突检测 (同供应商+同产品)
- [ ] 实现法规版本更新 (新版本替代旧版本)
- [ ] 实现关系去重

### 🔍 Phase 3: 混合检索 (Week 4)

#### 3.1 检索服务

- [ ] 实现 FactualSearch (SQL 精确查询)
- [ ] 实现 SemanticSearch (Vector 语义检索)
- [ ] 实现 GraphTraverse (关系图谱遍历)

#### 3.2 上下文组装

- [ ] 实现 ContextAssembler
- [ ] 优化 Prompt 模板
- [ ] 集成到 smartChat 流程

### 📈 Phase 4: 知识图谱增强 (Week 5+)

#### 4.1 图谱构建

- [ ] 导入 HS Code 体系
- [ ] 导入国家-认证要求关系
- [ ] 构建供应商能力图谱

#### 4.2 高级推理

- [ ] 实现多跳查询
- [ ] 实现路径发现
- [ ] 实现推荐引擎

---

## 🗂️ 文件结构规划

```
backend/src/modules/
├── memory/                      # 新增: 记忆管理模块
│   ├── memory.module.ts
│   ├── memory.service.ts        # 核心记忆服务
│   ├── memory.controller.ts
│   ├── extractors/              # 信息提取器
│   │   ├── quote.extractor.ts
│   │   ├── regulation.extractor.ts
│   │   └── relation.extractor.ts
│   ├── search/                  # 混合检索
│   │   ├── factual.search.ts
│   │   ├── semantic.search.ts
│   │   └── graph.search.ts
│   └── dto/
│       ├── save-quote.dto.ts
│       ├── save-regulation.dto.ts
│       └── save-relation.dto.ts
├── ai/
│   └── ai.service.ts            # 修改: 集成 Memory Agent
└── ...
```

---

## 📝 关键代码片段

### Memory Service 核心接口

```typescript
@Injectable()
export class MemoryService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  // 保存报价 (带 TTL)
  async saveQuote(data: SaveQuoteDto): Promise<Quote> {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (data.validityDays || 30));
  
    // 检查是否存在冲突报价
    const existing = await this.prisma.quote.findFirst({
      where: {
        supplierId: data.supplierId,
        itemName: data.itemName,
        isDeprecated: false,
        validUntil: { gt: new Date() }
      }
    });
  
    if (existing) {
      // 标记旧报价为过期
      await this.prisma.quote.update({
        where: { id: existing.id },
        data: { isDeprecated: true }
      });
    }
  
    return this.prisma.quote.create({
      data: {
        ...data,
        validUntil,
        source: 'memory_agent'
      }
    });
  }

  // 混合检索
  async hybridSearch(query: string, context: SearchContext): Promise<MemoryContext> {
    const [factualResults, semanticResults, graphResults] = await Promise.all([
      this.factualSearch(query, context),
      this.semanticSearch(query, context),
      this.graphSearch(query, context),
    ]);
  
    return this.assembleContext(factualResults, semanticResults, graphResults);
  }

  // 组装增强 Prompt
  private assembleContext(...results: any[]): MemoryContext {
    return {
      factualMemory: '【长期记忆 - 事实】\n' + results[0].summary,
      semanticMemory: '【长期记忆 - 法规】\n' + results[1].summary,
      graphMemory: '【长期记忆 - 关联】\n' + results[2].summary,
    };
  }
}
```

---

## ⚠️ 风险与应对

| 风险              | 影响             | 应对措施                       |
| ----------------- | ---------------- | ------------------------------ |
| pgvector 性能瓶颈 | 大规模向量检索慢 | 使用 HNSW 索引，限制返回数量   |
| 记忆爆炸          | 存储成本增加     | 定期清理低重要性记忆，压缩历史 |
| 信息提取不准确    | 存入错误数据     | 设置置信度阈值，人工审核机制   |
| 图谱关系过于复杂  | 查询性能下降     | 限制图谱深度，使用缓存         |

---

## 🎯 成功指标

- [ ] 报价查询准确率 > 95%
- [ ] 法规检索相关性 > 90%
- [ ] 对话记忆召回率 > 85%
- [ ] 平均响应时间 < 3s
- [ ] 过期数据自动清理率 100%

---

## 🔜 下一步行动

**立即执行 (今天)**:

1. 确认 PostgreSQL 数据库可用
2. 安装 pgvector 扩展
3. 更新 Prisma Schema
4. 创建 MemoryService 基础结构

**本周完成**:

1. 实现 Quote 和 KnowledgeChunk 的 CRUD
2. 集成到现有 AI 对话流程
3. 测试 TTL 过期机制
