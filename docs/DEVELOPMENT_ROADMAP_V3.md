# TradeNexus AI v3.0 开发路线图
## TradeNexus Station - 单机全栈架构方案

> **版本**: v3.0  
> **更新日期**: 2025-12-12  
> **目标**: 从"信息查询原型"升级为"业务闭环商业级软件"

---

## 📋 目录

1. [战略规划](#1-战略规划)
2. [系统架构升级](#2-系统架构升级)
3. [技术栈选型](#3-技术栈选型)
4. [智能体功能开发计划](#4-智能体功能开发计划)
5. [交互体验优化](#5-交互体验优化)
6. [开发路线图](#6-开发路线图)
7. [数据库设计](#7-数据库设计)
8. [现有代码修改清单](#8-现有代码修改清单)

---

## 1. 战略规划

### 1.1 核心战略调整

| 维度 | 当前状态 (v2.0) | 目标状态 (v3.0) |
|------|----------------|----------------|
| **输入端** | Amazon/TikTok 数据查询 | + 1688/Alibaba 供应链数据 |
| **输出端** | Amazon/TikTok | + Shopee/Lazada (东南亚) |
| **中间层** | 临时聊天记录 | 持久化业务对象 (Project/SKU) |
| **架构** | 纯前端 Client-side | 全栈 Docker 容器化 |

### 1.2 业务闭环目标

```
┌─────────────────────────────────────────────────────────────────┐
│                    TradeNexus AI v3.0 业务闭环                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [选品发现]        [货源匹配]        [合规检查]        [销售转化]   │
│       ↓                ↓                ↓                ↓      │
│   Amazon/TikTok  →  1688以图搜图  →  HS编码/认证  →  多语言开发信   │
│   趋势分析           利润试算         风险评估         社媒挖掘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 系统架构升级

### 2.1 架构对比

| 特性 | v2.0 (当前) | v3.0 (目标) |
|------|------------|------------|
| API Key 存储 | 前端 .env (不安全) | 后端环境变量 |
| 数据持久化 | localStorage | PostgreSQL |
| 长时任务 | 前端等待 | BullMQ 队列 |
| 爬虫能力 | 无 | Puppeteer + Stealth |
| AI 增强 | 通用 Prompt | RAG + 向量知识库 |

### 2.2 系统拓扑图

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TradeNexus Station (本地服务器)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   用户浏览器 ──HTTP:80──→ [Nginx 网关]                                │
│                              │                                      │
│                    ┌─────────┴─────────┐                            │
│                    ↓                   ↓                            │
│              [React 前端]        [Nest.js API]                       │
│              (静态资源)               │                              │
│                              ┌───────┼───────┐                      │
│                              ↓       ↓       ↓                      │
│                         [PostgreSQL] [Redis] [pgvector]             │
│                              │       │                              │
│                              │   [BullMQ 队列]                       │
│                              │       │                              │
│                              │   ┌───┴───┐                          │
│                              │   ↓       ↓                          │
│                              │ [爬虫Worker] [监控Worker]              │
│                              │   │                                  │
│                              │   ↓                                  │
│                              │ [Headless Chrome]                    │
│                              │   │                                  │
└──────────────────────────────│───│──────────────────────────────────┘
                               │   │
                    ┌──────────┴───┴──────────┐
                    ↓          ↓              ↓
              [Gemini API] [Amazon] [1688/TikTok]
```

---

## 3. 技术栈选型

### 3.1 单机版技术栈

| 模块 | 技术选型 | 版本 | 理由 |
|------|---------|------|------|
| **OS** | Ubuntu 22.04 / Windows WSL2 | - | 最佳服务器环境 |
| **容器** | Docker + Docker Compose | 24.x | 一键部署，环境隔离 |
| **前端** | React + Vite + TailwindCSS | 现有 | 保持现有架构 |
| **后端** | Nest.js (TypeScript) | 10.x | 企业级框架，模块化 |
| **数据库** | PostgreSQL + pgvector | 16 | 关系存储 + 向量检索 |
| **ORM** | Prisma | 5.x | 类型安全，迁移方便 |
| **缓存/队列** | Redis + BullMQ | 7.x | 异步任务队列 |
| **爬虫** | Puppeteer + Stealth | 22.x | 浏览器自动化 |
| **网关** | Nginx | alpine | 静态托管 + 反向代理 |

### 3.2 Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 1. 数据库服务
  postgres:
    image: postgres:16-alpine
    container_name: tradenexus_db
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: tradenexus
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d tradenexus"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 2. 消息队列服务
  redis:
    image: redis:7-alpine
    container_name: tradenexus_redis
    ports:
      - "6379:6379"
    volumes:
      - ./data/redis:/data
    restart: always

  # 3. 后端 API 服务
  backend:
    build: ./backend
    container_name: tradenexus_api
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/tradenexus
      REDIS_URL: redis://redis:6379
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      APIFY_TOKEN: ${APIFY_TOKEN}
      NODE_ENV: production
    ports:
      - "3000:3000"
    restart: always

  # 4. 爬虫 Worker 服务
  crawler:
    build: ./backend
    container_name: tradenexus_crawler
    command: npm run worker:crawler
    depends_on:
      - redis
      - postgres
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/tradenexus
      REDIS_URL: redis://redis:6379
    restart: always

  # 5. 前端静态托管
  frontend:
    image: nginx:alpine
    container_name: tradenexus_ui
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always
```

---

## 4. 智能体功能开发计划

### 4.1 供应链总监 (Supply Chain Director) - P0 优先级

> 🎯 **核心目标**: 连接"中国制造"，解决"货从哪来"

#### 功能清单

| 功能 | 描述 | 优先级 | 复杂度 |
|------|------|--------|--------|
| 1688 以图搜图 | 用 Amazon 产品图在 1688 找同款 | P0 | 高 |
| 1688 关键词搜索 | AI 翻译英文标题为中文搜索词 | P0 | 中 |
| 利润试算器 | 售价 - 采购价 - 运费 - 佣金 = 净利润 | P0 | 低 |
| 供应商评估 | 分析开店年限、回头率、发货速度 | P1 | 中 |
| 采购单生成 | 自动生成采购清单 Excel | P2 | 低 |

#### 利润计算公式

```typescript
interface CostStructure {
  sellPrice: number;        // Amazon 售价 (USD)
  costPrice: number;        // 1688 采购价 (CNY)
  exchangeRate: number;     // 汇率 (默认 7.2)
  weight: number;           // 产品重量 (kg)
  shippingPerKg: number;    // 头程运费 (CNY/kg)
  amazonReferralFee: number; // 佣金比例 (默认 15%)
  fbaFee: number;           // FBA 配送费 (USD)
  marketingCost: number;    // 广告费 (USD)
}

// 净利润 = (售价 × (1 - 佣金) - FBA费 - 广告费) × 汇率 - 采购价 - (重量 × 运费)
function calculateProfit(cost: CostStructure): number {
  const grossRevenue = cost.sellPrice * (1 - cost.amazonReferralFee);
  const netRevenueCNY = (grossRevenue - cost.fbaFee - cost.marketingCost) * cost.exchangeRate;
  const totalCost = cost.costPrice + (cost.weight * cost.shippingPerKg);
  return netRevenueCNY - totalCost;
}
```

### 4.2 贸易合规官 (Compliance Officer) - P1 优先级

> 🎯 **核心目标**: 降低合规风险，避免货物被扣

#### 功能清单

| 功能 | 描述 | 市场 | 优先级 |
|------|------|------|--------|
| HS 编码匹配 | 基于产品描述推荐 HS Code | 全球 | P0 |
| 出口退税计算 | 根据 HS Code 计算退税率 | 中国 | P1 |
| FDA 认证检查 | 食品/化妆品/医疗器械 | 美国 | P1 |
| CE 认证检查 | 电子产品安全认证 | 欧洲 | P1 |
| EPR 包装法检查 | 环保包装合规 | 欧洲 | P2 |
| 清真认证检查 | 宗教相关产品 | 东南亚 | P2 |

#### RAG 知识库构建

```
knowledge_base/
├── hs_codes/
│   ├── china_export_hs_2024.json
│   └── us_import_tariff.json
├── regulations/
│   ├── fda_cosmetics.md
│   ├── fda_food.md
│   ├── ce_marking_guide.md
│   └── epr_germany.md
├── certifications/
│   ├── cpc_children_products.md
│   └── halal_certification.md
└── embeddings/
    └── pgvector_index.sql
```

### 4.3 市场情报官 (Market Intelligence) - 增强

> 🎯 **核心目标**: 拓宽渠道，深度分析

#### 新增平台支持

| 平台 | 地区 | 数据类型 | 优先级 |
|------|------|----------|--------|
| Shopee | 东南亚 | 产品/销量/评论 | P1 |
| Lazada | 东南亚 | 产品/销量 | P1 |
| Temu | 全球 | 价格对比 | P2 |
| Shein | 全球 | 时尚趋势 | P2 |

#### 功能增强

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 评论情感分析 | 抓取差评，AI 总结痛点 | P0 |
| 竞品监控 | 定时监控 ASIN 价格变化 | P1 |
| 趋势预测 | 基于历史数据预测销量 | P2 |

### 4.4 客户开发官 (Lead Nurturing) - P2 优先级

> 🎯 **核心目标**: 提升 B2B/B2C 转化效率

#### 功能清单

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 社媒挖掘 | LinkedIn/Instagram/TikTok Hashtag 监控 | P1 |
| 多语言翻译 | 泰语/越南语/印尼语商务沟通 | P1 |
| Cold Email 生成 | 符合当地商务礼仪的开发信 | P0 |
| WhatsApp 集成 | Deep Link 一键发送 | P2 |

---

## 5. 交互体验优化

### 5.1 一键式工作流

#### 场景 A: 爆款复刻

```
输入: Amazon 产品链接
  ↓
[市场情报官] 分析竞品数据
  ↓
[供应链总监] 1688 找同款 + 利润计算
  ↓
[贸易合规官] 检查认证要求
  ↓
输出: 《可行性分析报告》PDF
```

#### 场景 B: 库存清仓

```
输入: 产品图片 + 库存量
  ↓
[市场情报官] 分析 TikTok 趋势
  ↓
[客户开发官] 生成短视频脚本 + 推荐达人
  ↓
输出: 《清仓营销方案》
```

### 5.2 新增页面

| 页面 | 功能 | 优先级 |
|------|------|--------|
| **产品库 (My Products)** | ERP 式产品管理，显示利润率/风险等级 | P0 |
| **任务中心 (Task Center)** | 监控任务、待办事项、合规审核 | P1 |
| **供应商库 (Suppliers)** | 收藏的 1688 供应商管理 | P1 |
| **报告中心 (Reports)** | 历史分析报告存档 | P2 |

---

## 6. 开发路线图

### 6.1 Phase 3: 闭环基础 (6 周)

#### Sprint 1: 后端地基 (Week 1-2)

| 任务 | 描述 | 负责人 | 状态 |
|------|------|--------|------|
| 3.1.1 | Docker Compose 环境搭建 | - | ⬜ |
| 3.1.2 | Nest.js 项目初始化 + Prisma 配置 | - | ⬜ |
| 3.1.3 | 迁移 Gemini Service 到后端 | - | ⬜ |
| 3.1.4 | 前端改为调用 `/api/analyze` | - | ⬜ |
| 3.1.5 | JWT 认证系统 (简单登录) | - | ⬜ |
| 3.1.6 | 数据库 Schema 设计 | - | ⬜ |

#### Sprint 2: 供应链数据获取 (Week 3-4)

| 任务 | 描述 | 负责人 | 状态 |
|------|------|--------|------|
| 3.2.1 | Puppeteer 基础服务集成 | - | ⬜ |
| 3.2.2 | 1688 以图搜图功能开发 | - | ⬜ |
| 3.2.3 | BullMQ 队列实现 | - | ⬜ |
| 3.2.4 | 爬虫风控处理 (代理/频率) | - | ⬜ |
| 3.2.5 | 1688Service.ts 开发 | - | ⬜ |

#### Sprint 3: 业务闭环与持久化 (Week 5-6)

| 任务 | 描述 | 负责人 | 状态 |
|------|------|--------|------|
| 3.3.1 | Products 表 CRUD API | - | ⬜ |
| 3.3.2 | SourcingResults 关联存储 | - | ⬜ |
| 3.3.3 | 利润试算器 API | - | ⬜ |
| 3.3.4 | 前端"产品详情页"开发 | - | ⬜ |
| 3.3.5 | Dashboard 产品看板 | - | ⬜ |

### 6.2 Phase 4: 合规与多市场 (4 周)

| 任务 | 描述 | 状态 |
|------|------|------|
| 4.1 | RAG 向量知识库搭建 (pgvector) | ⬜ |
| 4.2 | 贸易合规官智能体开发 | ⬜ |
| 4.3 | HS 编码匹配功能 | ⬜ |
| 4.4 | Shopee/Lazada 数据源集成 | ⬜ |
| 4.5 | 多语言 UI 支持 (中/英) | ⬜ |

### 6.3 Phase 5: CRM 与自动化 (4 周)

| 任务 | 描述 | 状态 |
|------|------|------|
| 5.1 | 客户开发官智能体开发 | ⬜ |
| 5.2 | AI 邮件/脚本生成 | ⬜ |
| 5.3 | PDF/Excel 报告导出 | ⬜ |
| 5.4 | 移动端适配 | ⬜ |
| 5.5 | 定时任务 (价格监控) | ⬜ |

---

## 7. 数据库设计

### 7.1 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 产品表 (选品数据)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  platform VARCHAR(50) NOT NULL, -- 'amazon', 'tiktok', 'shopee'
  platform_id VARCHAR(100) NOT NULL, -- ASIN 或 Product ID
  title VARCHAR(500) NOT NULL,
  image_url TEXT,
  selling_price DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  category VARCHAR(200),
  bsr_rank INTEGER,
  review_count INTEGER,
  rating DECIMAL(3,2),
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'analyzed', 'sourced', 'archived'
  ai_analysis JSONB, -- AI 分析结果
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(platform, platform_id)
);

-- 货源表 (1688 数据)
CREATE TABLE sourcing_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  supplier_url TEXT NOT NULL,
  supplier_name VARCHAR(200),
  cost_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'CNY',
  moq INTEGER, -- 最小起订量
  supplier_rating DECIMAL(3,2),
  shop_years INTEGER, -- 开店年限
  match_score DECIMAL(3,2), -- AI 匹配度
  created_at TIMESTAMP DEFAULT NOW()
);

-- 利润计算表
CREATE TABLE profit_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  sourcing_id UUID REFERENCES sourcing_results(id),
  sell_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  fba_fee DECIMAL(10,2),
  marketing_cost DECIMAL(10,2),
  net_profit DECIMAL(10,2),
  profit_margin DECIMAL(5,2), -- 百分比
  exchange_rate DECIMAL(6,4),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 合规检查表
CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  market VARCHAR(50) NOT NULL, -- 'US', 'EU', 'SEA'
  hs_code VARCHAR(20),
  tax_rate DECIMAL(5,2),
  certifications_required TEXT[], -- ['FDA', 'CE', 'CPC']
  risk_level VARCHAR(20), -- 'low', 'medium', 'high'
  ai_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 任务日志表
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'AMAZON_SEARCH', '1688_FIND', 'PROFIT_CALC'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 向量索引 (RAG 知识库)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100), -- 'hs_code', 'regulation', 'certification'
  title VARCHAR(500),
  content TEXT,
  embedding vector(1536), -- OpenAI embedding 维度
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### 7.2 ER 图

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   users     │       │    products      │       │ sourcing_results│
├─────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)     │──1:N──│ id (PK)          │──1:N──│ id (PK)         │
│ email       │       │ user_id (FK)     │       │ product_id (FK) │
│ password    │       │ platform         │       │ supplier_url    │
│ name        │       │ platform_id      │       │ cost_price      │
└─────────────┘       │ title            │       │ moq             │
                      │ selling_price    │       │ match_score     │
                      │ status           │       └─────────────────┘
                      │ ai_analysis      │
                      └────────┬─────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
    │profit_calculations│ │compliance_  │ │     jobs        │
    ├─────────────────┤ │   checks    │ ├─────────────────┤
    │ id (PK)         │ ├─────────────┤ │ id (PK)         │
    │ product_id (FK) │ │ id (PK)     │ │ user_id (FK)    │
    │ net_profit      │ │ product_id  │ │ type            │
    │ profit_margin   │ │ hs_code     │ │ status          │
    └─────────────────┘ │ risk_level  │ │ input/output    │
                        └─────────────┘ └─────────────────┘
```

---

## 8. 现有代码修改清单

### 8.1 立即执行 (Immediate Actions)

| 序号 | 文件 | 修改内容 | 优先级 |
|------|------|----------|--------|
| 1 | `src/types.ts` | 重构 `AnalysisResult` 接口，增加 `sourcingInfo` 和 `complianceCheck` | P0 |
| 2 | `.env` | API Key 移除前端，改为后端代理 | P0 |
| 3 | `src/services/` | 新增 `1688Service.ts` (Mock 数据先行) | P0 |
| 4 | `src/services/geminiService.ts` | 优化 Prompt，增加外贸专家上下文 | P1 |
| 5 | `package.json` | 添加后端依赖 (Nest.js, Prisma, BullMQ) | P0 |

### 8.2 AnalysisResult 接口重构

```typescript
// src/types.ts - 新增字段

export interface SourcingInfo {
  supplier_url: string;
  supplier_name: string;
  cost_price: number;
  currency: string;
  moq: number;
  supplier_rating: number;
  match_score: number;
  image_url: string;
}

export interface ComplianceCheck {
  market: 'US' | 'EU' | 'SEA';
  hs_code: string;
  tax_rate: number;
  certifications_required: string[];
  risk_level: 'low' | 'medium' | 'high';
  notes: string;
}

export interface ProfitCalculation {
  sell_price: number;
  cost_price: number;
  shipping_cost: number;
  platform_fee: number;
  fba_fee: number;
  marketing_cost: number;
  net_profit: number;
  profit_margin: number;
  exchange_rate: number;
}

export interface AnalysisResult {
  // 现有字段...
  thinking_process: string;
  agentProtocolLogs: AgentProtocolEvent[];
  query: string;
  summary: string;
  strategicAdvice: string;
  trendData: TrendDataPoint[];
  topProducts: ProductInsight[];
  relatedKeywords: string[];
  
  // v3.0 新增字段
  sourcingInfo?: SourcingInfo[];      // 供应链数据
  complianceCheck?: ComplianceCheck;  // 合规检查
  profitCalculation?: ProfitCalculation; // 利润计算
}
```

### 8.3 Gemini Prompt 优化

```typescript
// src/services/geminiService.ts - 优化 systemPrompt

const systemPrompt = `
你是 TradeNexus AI 的核心智能体 - AI 总管（General Manager）。

【角色定位】
你是一名资深的中国外贸专家，拥有 15 年跨境电商经验，精通：
- FOB/CIF/DDP 等国际贸易术语
- 中国出口退税政策（13%/9%/6% 档位）
- Amazon/TikTok/Shopee 平台运营规则
- 1688 供应链采购与供应商评估
- 各国海关法规与认证要求

【核心职责】
1. 协调四大智能体完成任务
2. 分析市场数据，给出可执行的选品建议
3. 评估产品利润空间和合规风险
4. 生成专业的外贸分析报告

【输出要求】
- 必须包含 profitMargin 字段（格式：25-35%）
- 必须评估合规风险等级（low/medium/high）
- 建议必须具体可执行，避免空泛建议
- 使用专业外贸术语，但解释清晰

【数据来源】
${toolContext}
`;
```

### 8.4 项目目录结构 (v3.0)

```
TradeNexus_AI/
├── frontend/                    # React 前端 (现有代码迁移)
│   ├── src/
│   │   ├── components/
│   │   ├── services/           # 改为调用后端 API
│   │   ├── pages/              # 新增页面
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Products.tsx
│   │   │   └── Suppliers.tsx
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Nest.js 后端 (新增)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # 认证模块
│   │   │   ├── products/       # 产品管理
│   │   │   ├── sourcing/       # 供应链 (1688)
│   │   │   ├── compliance/     # 合规检查
│   │   │   ├── ai/             # Gemini 集成
│   │   │   └── jobs/           # 任务队列
│   │   ├── workers/
│   │   │   ├── crawler.worker.ts
│   │   │   └── monitor.worker.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
│
├── knowledge_base/              # RAG 知识库 (新增)
│   ├── hs_codes/
│   ├── regulations/
│   └── embeddings/
│
├── docker-compose.yml           # 容器编排
├── nginx.conf                   # 网关配置
├── .env.example                 # 环境变量模板
└── docs/
    ├── PROJECT_DOCUMENTATION.md
    └── DEVELOPMENT_ROADMAP_V3.md  # 本文档
```

---

## 📌 附录

### A. 开发者注意事项

1. **API Key 安全**: 所有 API Key 必须在后端 `.env` 中配置，前端禁止直接调用第三方 API
2. **1688 爬虫策略**: 建议使用"半自动化"方式 - 人工登录获取 Cookie，程序复用 Cookie 搜索
3. **数据备份**: 配置每日凌晨自动备份 PostgreSQL 数据
4. **日志监控**: 使用 Docker logs 或集成 Grafana 监控服务状态

### B. 参考资源

- [Nest.js 官方文档](https://docs.nestjs.com/)
- [Prisma ORM 文档](https://www.prisma.io/docs)
- [BullMQ 队列文档](https://docs.bullmq.io/)
- [Puppeteer 文档](https://pptr.dev/)
- [pgvector 向量扩展](https://github.com/pgvector/pgvector)

### C. 里程碑检查点

| 里程碑 | 预计完成 | 验收标准 |
|--------|----------|----------|
| Phase 3 完成 | Week 6 | Docker 一键启动，1688 搜索可用，产品可持久化 |
| Phase 4 完成 | Week 10 | 合规检查可用，Shopee 数据可查 |
| Phase 5 完成 | Week 14 | 报告可导出，移动端可访问 |

---

*文档版本: v3.0*  
*最后更新: 2025-12-12*
