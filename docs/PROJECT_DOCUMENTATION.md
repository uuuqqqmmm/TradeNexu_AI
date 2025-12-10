# TradeNexus AI - 外贸人工智能军团 开发文档

> 📅 文档创建日期: 2024年12月11日  
> 📦 项目版本: v2.0  
> 🔗 GitHub: https://github.com/uuuqqqmmm/TradeNexu_AI

---

## 目录

1. [项目概述](#1-项目概述)
2. [开发指令汇总](#2-开发指令汇总)
3. [AI开发计划](#3-ai开发计划)
4. [系统架构详解](#4-系统架构详解)
5. [前端架构与功能](#5-前端架构与功能)
6. [后端服务与API](#6-后端服务与api)
7. [现有程序不足与改进计划](#7-现有程序不足与改进计划)
8. [部署与配置](#8-部署与配置)

---

## 1. 项目概述

### 1.1 项目定位

**TradeNexus AI** 是一个面向外贸从业者的智能助手平台，采用"AI军团"架构，通过多个专业化AI智能体协同工作，为用户提供：

- 🔍 **市场情报分析** - 全球电商平台产品趋势、爆款发现
- 👥 **客户开发管理** - 潜在客户挖掘、CRM管理
- ⚖️ **贸易合规咨询** - HS编码、关税、法规查询
- 🚚 **供应链优化** - 物流方案、供应商管理

### 1.2 核心理念

```
┌─────────────────────────────────────────────────────────────┐
│                    用户指令 (自然语言)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI 总管 (General Manager)                  │
│              意图识别 → 任务分解 → 智能体调度                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────┬──────────┼──────────┬─────────┐
        ▼         ▼          ▼          ▼         ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │市场情报官│ │客户开发官│ │贸易合规官│ │供应链总监│
   └─────────┘ └─────────┘ └─────────┘ └─────────┘
        │         │          │          │
        └─────────┴──────────┴──────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   结构化报告输出  │
                    └─────────────────┘
```

### 1.3 技术栈

| 层级 | 技术选型 |
|------|----------|
| **前端框架** | React 18 + TypeScript |
| **构建工具** | Vite 5 |
| **UI组件** | 自定义组件 + Lucide Icons |
| **图表库** | Recharts |
| **AI引擎** | Google Gemini 2.5 Flash |
| **数据API** | Rainforest API (Amazon), TikTok API |
| **样式方案** | TailwindCSS (自定义主题) |

---

## 2. 开发指令汇总

### 2.1 核心功能需求

| 序号 | 开发指令 | 优先级 | 状态 |
|------|----------|--------|------|
| 1 | 构建外贸AI军团多智能体架构 | P0 | ✅ 已完成 |
| 2 | 实现AI总管任务调度与意图识别 | P0 | ✅ 已完成 |
| 3 | 集成Google Gemini API进行智能分析 | P0 | ✅ 已完成 |
| 4 | 开发市场情报官模块 - 产品趋势分析 | P0 | ✅ 已完成 |
| 5 | 实现Amazon产品数据调研功能 | P1 | ✅ 已完成 |
| 6 | 实现TikTok Shop产品调研功能 | P1 | ✅ 已完成 |
| 7 | 开发AliExpress价格对比与利润计算 | P1 | ✅ 已完成 |
| 8 | 构建Agent间通信协议可视化 | P1 | ✅ 已完成 |
| 9 | 实现思维链(Chain of Thought)展示 | P2 | ✅ 已完成 |
| 10 | 开发产品资源库管理功能 | P2 | ✅ 已完成 |

### 2.2 UI/UX需求

| 序号 | 开发指令 | 状态 |
|------|----------|------|
| 1 | 设计深色科技风格界面 (Nexus主题) | ✅ 已完成 |
| 2 | 实现左侧智能体矩阵导航栏 | ✅ 已完成 |
| 3 | 开发中央对话式交互界面 | ✅ 已完成 |
| 4 | 实现右侧MCP协议日志面板 | ✅ 已完成 |
| 5 | 设计产品卡片组件(支持外链跳转) | ✅ 已完成 |
| 6 | 实现趋势图表可视化 | ✅ 已完成 |
| 7 | 开发Amazon/TikTok调研弹窗 | ✅ 已完成 |

### 2.3 数据集成需求

| 序号 | 开发指令 | 状态 |
|------|----------|------|
| 1 | 集成Rainforest API获取Amazon真实数据 | ✅ 已完成 |
| 2 | 实现API降级策略(真实→模拟数据) | ✅ 已完成 |
| 3 | 支持多站点Amazon数据(US/DE/UK/JP/CA) | ✅ 已完成 |
| 4 | 实现TikTok Shop多地区支持 | ✅ 已完成 |
| 5 | 开发AliExpress供应商数据服务 | ✅ 已完成 |

---

## 3. AI开发计划

### 3.1 Phase 1: 基础架构 (已完成)

```
目标: 搭建多智能体协作框架
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 1.1 定义5大核心智能体角色
    - AI总管 (General Manager) - 任务调度中枢
    - 市场情报官 (Market Intelligence Officer) - 数据分析
    - 客户开发官 (Lead Nurturing Officer) - CRM管理
    - 贸易合规官 (Compliance Officer) - 法规咨询
    - 供应链总监 (Supply Chain Director) - 物流优化

✅ 1.2 设计Agent通信协议 (A2A Protocol)
    - REQUEST: 智能体间请求
    - RESPONSE: 数据响应
    - BROADCAST: 广播通知

✅ 1.3 实现Gemini API集成
    - 结构化JSON输出 (responseSchema)
    - 工具调用 (Function Calling)
    - 思维链推理 (Chain of Thought)
```

### 3.2 Phase 2: 市场调研模块 (已完成)

```
目标: 实现多平台产品数据获取与分析
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 2.1 Amazon调研功能
    - ASIN精确查询
    - 关键词搜索
    - URL解析
    - BSR排名获取
    - 销量标签解析

✅ 2.2 TikTok Shop调研
    - 产品搜索
    - 热门趋势获取
    - 多地区支持 (US/UK/ID/TH/VN/MY)

✅ 2.3 AliExpress价格对比
    - 供应商搜索
    - 利润空间计算
    - ROI分析
```

### 3.3 Phase 3: 智能分析增强 (进行中)

```
目标: 提升AI分析深度与准确性
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 3.1 Agentic RAG实现
    - 领域知识库构建
    - 语义检索增强
    - 上下文记忆管理

🔄 3.2 工具调用优化
    - 多工具并行执行
    - 错误重试机制
    - 结果缓存策略

⏳ 3.3 竞品深度分析
    - 评论情感分析
    - 价格历史追踪
    - 竞争对手对比
```

### 3.4 Phase 4: 业务功能扩展 (规划中)

```
目标: 完善外贸全流程支持
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ 4.1 客户开发官功能
    - 潜在客户挖掘
    - 邮件模板生成
    - 跟进提醒管理

⏳ 4.2 贸易合规官功能
    - HS编码智能查询
    - 关税计算器
    - 各国法规库

⏳ 4.3 供应链总监功能
    - 物流方案比价
    - 供应商评估
    - 库存预警
```

---

## 4. 系统架构详解

### 4.1 项目目录结构

```
TradeNexus_AI/
├── 📄 index.html              # 入口HTML
├── 📄 package.json            # 依赖配置
├── 📄 vite.config.ts          # Vite构建配置
├── 📄 tsconfig.json           # TypeScript配置
├── 📄 .env.example            # 环境变量模板
│
├── 📁 src/
│   ├── 📄 App.tsx             # 主应用组件
│   ├── 📄 index.tsx           # React入口
│   ├── 📄 types.ts            # TypeScript类型定义
│   ├── 📄 vite-env.d.ts       # Vite环境声明
│   │
│   ├── 📁 components/         # UI组件
│   │   ├── 📄 Sidebar.tsx              # 左侧导航栏
│   │   ├── 📄 ProductCard.tsx          # 产品卡片
│   │   ├── 📄 TrendChart.tsx           # 趋势图表
│   │   ├── 📄 MCPLiveLog.tsx           # 协议日志
│   │   ├── 📄 ThinkingChain.tsx        # 思维链展示
│   │   ├── 📄 AmazonResearchDialog.tsx # Amazon调研弹窗
│   │   ├── 📄 TikTokResearchDialog.tsx # TikTok调研弹窗
│   │   └── 📄 ResearchSidebar.tsx      # 调研侧边栏
│   │
│   └── 📁 services/           # 业务服务
│       ├── 📄 geminiService.ts     # Gemini AI服务
│       ├── 📄 rainforestService.ts # Amazon数据服务
│       ├── 📄 tiktokService.ts     # TikTok数据服务
│       ├── 📄 aliexpressService.ts # AliExpress服务
│       └── 📄 toolService.ts       # 工具调用服务
│
├── 📁 services/               # 根级服务(备份)
│   └── 📄 geminiService.ts
│
└── 📁 scripts/                # 工具脚本
    └── 📄 test-api.ts         # API测试脚本
```

### 4.2 数据流架构

```
┌────────────────────────────────────────────────────────────────────┐
│                          用户界面层 (UI Layer)                      │
├────────────────────────────────────────────────────────────────────┤
│  Sidebar.tsx  │  App.tsx (Chat)  │  MCPLiveLog.tsx  │  Dialogs    │
└───────┬───────┴────────┬─────────┴────────┬─────────┴──────┬──────┘
        │                │                  │                │
        ▼                ▼                  ▼                ▼
┌────────────────────────────────────────────────────────────────────┐
│                        状态管理层 (State Layer)                     │
├────────────────────────────────────────────────────────────────────┤
│  useState: chatHistory, logs, agentStatuses, researchTasks        │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                        服务层 (Service Layer)                       │
├────────────────────────────────────────────────────────────────────┤
│  geminiService  │  rainforestService  │  tiktokService  │ aliexpress│
└────────┬────────┴─────────┬───────────┴────────┬────────┴─────┬────┘
         │                  │                    │              │
         ▼                  ▼                    ▼              ▼
┌────────────────────────────────────────────────────────────────────┐
│                        外部API层 (External APIs)                    │
├────────────────────────────────────────────────────────────────────┤
│  Google Gemini  │  Rainforest API  │  TikTok API  │  AliExpress   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5. 前端架构与功能

### 5.1 核心组件详解

#### 5.1.1 App.tsx - 主应用组件

**职责**: 应用状态管理、用户交互处理、组件编排

**核心状态**:
```typescript
const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.GENERAL_MANAGER);
const [query, setQuery] = useState('');
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [chatHistory, setChatHistory] = useState<Message[]>([]);
const [logs, setLogs] = useState<MCPLog[]>([]);
const [agentStatuses, setAgentStatuses] = useState<Record<AgentType, MCPToolStatus>>({...});
const [researchTasks, setResearchTasks] = useState<ResearchTask[]>([]);
```

**核心功能**:
- `handleAnalyze()`: 处理用户查询，调用Gemini API
- `addSystemLog()`: 添加系统日志
- `addProtocolLog()`: 添加Agent通信协议日志
- `handleAmazonProductsFound()`: 处理Amazon调研结果

#### 5.1.2 Sidebar.tsx - 智能体矩阵导航

**功能模块**:

| 模块 | 功能描述 |
|------|----------|
| 智能体矩阵 | 显示5大AI智能体状态(空闲/运行中/成功/错误) |
| 市场调研模块 | Amazon/TikTok调研入口、调研任务列表 |
| 产品资源库 | 爆款产品目录、客户咨询目录、待拓展目录 |
| 系统健康度 | 核心编排器、AgentOps监控状态 |

**智能体定义**:
```typescript
const agents = [
  { id: AgentType.GENERAL_MANAGER, icon: Command, label: 'AI 总管 (指挥官)' },
  { id: AgentType.MARKET_INTEL, icon: Globe, label: '市场情报官' },
  { id: AgentType.LEAD_NURTURING, icon: Users, label: '客户开发官' },
  { id: AgentType.COMPLIANCE, icon: Scale, label: '贸易合规官' },
  { id: AgentType.SUPPLY_CHAIN, icon: Network, label: '供应链总监' },
];
```

#### 5.1.3 AmazonResearchDialog.tsx - Amazon调研弹窗

**支持的查询类型**:
- **ASIN查询**: 输入 `B08F6Z8666` 格式的产品ID
- **关键词搜索**: 输入产品关键词如 `wireless earbuds`
- **URL解析**: 粘贴Amazon产品链接自动提取ASIN

**支持的站点**:
```typescript
export const AMAZON_DOMAINS = [
  { label: '美国站 (amazon.com)', value: 'amazon.com' },
  { label: '德国站 (amazon.de)', value: 'amazon.de' },
  { label: '英国站 (amazon.co.uk)', value: 'amazon.co.uk' },
  { label: '日本站 (amazon.co.jp)', value: 'amazon.co.jp' },
  { label: '加拿大站 (amazon.ca)', value: 'amazon.ca' },
];
```

**数据展示**:
- 产品图片、标题、ASIN
- 价格、销量标签 (如 "5K+ bought in past month")
- BSR排名、数据来源标识(真实/模拟)

#### 5.1.4 TikTokResearchDialog.tsx - TikTok调研弹窗

**功能标签页**:
- **产品搜索**: 关键词搜索TikTok Shop产品
- **热门趋势**: 获取各地区热销产品

**支持地区**:
```typescript
export const TIKTOK_REGIONS = [
  { code: 'US', name: '美国站 (TikTok Shop US)' },
  { code: 'UK', name: '英国站 (TikTok Shop UK)' },
  { code: 'ID', name: '印尼站 (TikTok Shop ID)' },
  { code: 'TH', name: '泰国站 (TikTok Shop TH)' },
  { code: 'VN', name: '越南站 (TikTok Shop VN)' },
  { code: 'MY', name: '马来西亚站 (TikTok Shop MY)' },
];
```

#### 5.1.5 ProductCard.tsx - 产品卡片组件

**展示信息**:
- 产品图片 (支持悬停放大效果)
- 数据来源标签 (真实数据/模拟数据)
- 趋势分数 (0-100)
- 产品名称、描述
- 合规提示 (如HS编码)
- 标签云
- 预估毛利

**交互功能**:
- 点击跳转Amazon搜索页面
- 悬停显示外链图标

#### 5.1.6 TrendChart.tsx - 趋势图表

**基于Recharts实现**:
- 面积图展示搜索热度
- 7天数据趋势
- 渐变填充效果
- 自定义Tooltip

#### 5.1.7 MCPLiveLog.tsx - 协议日志面板

**日志类型**:
1. **系统日志**: 显示工具名称、状态、消息
2. **协议日志**: 显示Agent间通信
   - REQUEST (蓝色): 请求方 → 接收方
   - RESPONSE (绿色): 响应方 → 请求方

**日志格式**:
```typescript
interface MCPLog {
  id: string;
  timestamp: string;
  toolName: string;
  status: MCPToolStatus;
  message: string;
  protocolData?: AgentProtocolEvent;
}
```

#### 5.1.8 ThinkingChain.tsx - 思维链展示

**功能**: 可折叠展示AI的推理过程

**样式**: 
- 折叠状态显示"思考过程"按钮
- 展开后显示等宽字体的推理文本

### 5.2 类型定义 (types.ts)

#### 核心枚举

```typescript
export enum AgentType {
  GENERAL_MANAGER = 'AI 总管',
  MARKET_INTEL = '市场情报官',
  LEAD_NURTURING = '客户开发官',
  COMPLIANCE = '贸易合规官',
  SUPPLY_CHAIN = '供应链总监'
}

export enum MCPToolStatus {
  IDLE = '空闲',
  RUNNING = '运行中',
  SUCCESS = '成功',
  ERROR = '错误'
}
```

#### 核心接口

```typescript
// 分析结果
export interface AnalysisResult {
  thinking_process: string;           // 思维链
  agentProtocolLogs: AgentProtocolEvent[];  // Agent通信日志
  query: string;
  summary: string;                    // 分析摘要
  strategicAdvice: string;            // 战略建议
  trendData: TrendDataPoint[];        // 趋势数据
  topProducts: ProductInsight[];      // 推荐产品
  relatedKeywords: string[];          // 相关关键词
}

// Agent通信事件
export interface AgentProtocolEvent {
  step: number;
  from: AgentType;
  to: AgentType;
  action: 'REQUEST' | 'RESPONSE' | 'BROADCAST';
  content: string;
}

// Amazon产品数据
export interface AmazonProductData {
  asin: string;
  title: string;
  recentSalesLabel: string | null;
  bsr: number | null;
  bsrCategory: string | null;
  price: number | null;
  currency: string;
  mainImage: string;
  link: string;
  fetchedAt: number;
  dataSource: 'real' | 'mock';
}
```

---

## 6. 后端服务与API

### 6.1 geminiService.ts - AI核心服务

**主要功能**: 调用Google Gemini API进行智能分析

**工作流程**:
```
1. 工具执行阶段 (Tool Execution Phase)
   ├── 构建工具调用提示词
   ├── 调用Gemini获取工具调用决策
   ├── 执行工具 (fetchProductDetails等)
   └── 收集工具返回数据

2. JSON生成阶段 (JSON Generation Phase)
   ├── 构建系统提示词 (含工具数据)
   ├── 调用Gemini生成结构化响应
   └── 解析并返回AnalysisResult
```

**响应Schema**:
```typescript
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    thinking_process: { type: Type.STRING },
    agentProtocolLogs: { type: Type.ARRAY, items: {...} },
    query: { type: Type.STRING },
    summary: { type: Type.STRING },
    strategicAdvice: { type: Type.STRING },
    trendData: { type: Type.ARRAY, items: {...} },
    topProducts: { type: Type.ARRAY, items: {...} },
    relatedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};
```

### 6.2 rainforestService.ts - Amazon数据服务

**API配置**:
```typescript
const RAINFOREST_BASE_URL = 'https://api.rainforestapi.com/request';
```

**核心函数**:

| 函数 | 功能 | 参数 |
|------|------|------|
| `fetchAmazonProductByAsin()` | 根据ASIN获取产品详情 | asin, domain |
| `searchAmazonProducts()` | 关键词搜索产品 | keyword, domain, maxResults |
| `queryAmazonData()` | 统一查询入口 | AmazonResearchQuery |
| `getDataSourceMode()` | 检测数据源模式 | - |

**降级策略**:
```typescript
const getRainforestApiKey = (): string | null => {
  const key = import.meta.env.VITE_RAINFOREST_API_KEY;
  return key && key !== 'your_rainforest_api_key' ? key : null;
};

// 无API Key时返回模拟数据
if (!apiKey) {
  return generateMockProduct(query, 0);
}
```

### 6.3 tiktokService.ts - TikTok数据服务

**核心函数**:

| 函数 | 功能 |
|------|------|
| `searchTikTokProducts()` | 搜索TikTok Shop产品 |
| `getTikTokTrendingProducts()` | 获取热门趋势产品 |
| `getTikTokDataSourceMode()` | 检测数据源模式 |

**数据结构**:
```typescript
export interface TikTokProductData {
  productId: string;
  title: string;
  price: number | null;
  originalPrice: number | null;
  salesCount: string | null;    // "10K+ sold"
  rating: number | null;
  videoViews: string | null;    // "1.2M views"
  shopName: string;
  link: string;
  dataSource: 'real' | 'mock';
}
```

### 6.4 aliexpressService.ts - AliExpress服务

**核心功能**:
- 供应商产品搜索
- 利润空间计算
- 价格对比分析

**利润计算**:
```typescript
export const calculateProfit = (
  amazonPrice: number,
  aliexpressPrice: number,
  shippingCost: number = 0,
  platformFeeRate: number = 0.15  // Amazon默认15%
): ProfitCalculation => {
  const platformFee = amazonPrice * platformFeeRate;
  const totalCost = aliexpressPrice + shippingCost;
  const estimatedProfit = amazonPrice - totalCost - platformFee;
  const profitMargin = (estimatedProfit / amazonPrice) * 100;
  const roi = (estimatedProfit / totalCost) * 100;
  
  // 推荐等级: excellent(>40%) / good(>25%) / marginal(>10%) / not_recommended
  ...
};
```

### 6.5 toolService.ts - 工具调用服务

**Gemini工具定义**:
```typescript
export const marketIntelligenceTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "fetchProductDetails",
        description: "搜索电商平台的产品信息...",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING },
            platform: { type: Type.STRING, enum: ["Amazon", "TikTok", "Alibaba"] }
          }
        }
      },
      {
        name: "fetchCompetitors",
        description: "查找特定产品的竞争对手信息",
        ...
      }
    ]
  }
];
```

**工具映射**:
```typescript
export const toolsMap = {
  fetchProductDetails: fetchProductDetails,
  fetchCompetitors: fetchCompetitors,
  fetchProductReviews: fetchProductReviews
};
```

---

## 7. 现有程序不足与改进计划

### 7.1 当前不足分析

#### 🔴 高优先级问题

| 问题 | 描述 | 影响 |
|------|------|------|
| **TikTok API未真实集成** | 当前仅使用模拟数据 | 无法获取真实TikTok热销数据 |
| **AliExpress API未真实集成** | 当前仅使用模拟数据 | 无法进行真实价格对比 |
| **无数据持久化** | 所有数据存储在内存中 | 刷新页面数据丢失 |
| **无用户认证系统** | 无登录/注册功能 | 无法保存用户偏好和历史 |

#### 🟡 中优先级问题

| 问题 | 描述 | 影响 |
|------|------|------|
| **客户开发官功能空缺** | 仅有UI占位，无实际功能 | 无法进行客户管理 |
| **贸易合规官功能空缺** | 仅有UI占位，无实际功能 | 无法查询HS编码/关税 |
| **供应链总监功能空缺** | 仅有UI占位，无实际功能 | 无法进行物流比价 |
| **无错误边界处理** | API失败时用户体验差 | 可能导致白屏 |
| **无国际化支持** | 仅支持中文 | 限制国际用户使用 |

#### 🟢 低优先级问题

| 问题 | 描述 |
|------|------|
| 无深色/浅色主题切换 | 仅支持深色主题 |
| 无移动端适配 | 在手机上体验较差 |
| 无键盘快捷键 | 操作效率可提升 |
| 无导出功能 | 无法导出分析报告 |

### 7.2 改进开发计划

#### Phase A: 数据层增强 (建议优先级: P0)

```
目标: 实现真实数据获取与持久化
预计工期: 2-3周
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A.1 TikTok真实API集成
    - 集成 Kalodata API 或 ScrapeCreators API
    - 实现热销产品实时获取
    - 添加视频播放量、互动数据

A.2 AliExpress真实API集成
    - 集成 AliExpress Affiliate API
    - 实现供应商搜索
    - 添加运费计算、发货时效

A.3 数据持久化方案
    - 方案A: 集成 Supabase (推荐)
    - 方案B: 使用 Firebase
    - 实现: 搜索历史、收藏产品、调研报告存储

A.4 缓存策略
    - 实现 API 响应缓存 (SWR/React Query)
    - 设置合理的缓存过期时间
    - 减少重复API调用
```

#### Phase B: 智能体功能完善 (建议优先级: P1)

```
目标: 实现其他3个智能体的核心功能
预计工期: 4-6周
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

B.1 客户开发官模块
    - 潜在客户数据导入 (CSV/Excel)
    - AI邮件模板生成
    - 跟进提醒日历
    - 客户标签管理

B.2 贸易合规官模块
    - HS编码智能查询 (集成海关数据库)
    - 关税计算器 (支持多国)
    - 各国进口法规库
    - 合规风险预警

B.3 供应链总监模块
    - 物流方案比价 (海运/空运/快递)
    - 供应商评分系统
    - 库存预警设置
    - 采购订单管理
```

#### Phase C: 用户体验优化 (建议优先级: P2)

```
目标: 提升整体用户体验
预计工期: 2-3周
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

C.1 用户系统
    - 登录/注册 (支持Google OAuth)
    - 用户偏好设置
    - 使用配额管理

C.2 错误处理增强
    - 全局错误边界
    - 友好的错误提示
    - 自动重试机制

C.3 性能优化
    - 组件懒加载
    - 虚拟列表 (长列表优化)
    - 图片懒加载

C.4 导出功能
    - PDF报告导出
    - Excel数据导出
    - 分享链接生成
```

#### Phase D: 高级功能 (建议优先级: P3)

```
目标: 差异化竞争功能
预计工期: 4-8周
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

D.1 AI深度分析
    - 评论情感分析 (NLP)
    - 价格走势预测
    - 市场饱和度评估

D.2 自动化工作流
    - 定时市场监控
    - 价格变动提醒
    - 竞品上新通知

D.3 协作功能
    - 团队工作空间
    - 报告分享与评论
    - 权限管理

D.4 移动端App
    - React Native 开发
    - 推送通知
    - 离线功能
```

### 7.3 技术债务清单

| 项目 | 当前状态 | 建议改进 |
|------|----------|----------|
| 状态管理 | useState分散 | 迁移至 Zustand/Jotai |
| API调用 | 原生fetch | 使用 React Query |
| 表单处理 | 手动管理 | 使用 React Hook Form |
| 类型安全 | 部分any | 完善类型定义 |
| 测试覆盖 | 无测试 | 添加 Vitest 单元测试 |
| 代码规范 | 无统一规范 | 配置 ESLint + Prettier |

---

## 8. 部署与配置

### 8.1 环境变量配置

创建 `.env` 文件 (基于 `.env.example`):

```bash
# Google Gemini API Key (必需)
API_KEY=your_gemini_api_key_here

# Rainforest API Key (Amazon数据，可选)
VITE_RAINFOREST_API_KEY=your_rainforest_api_key_here

# Apify API Token (TikTok数据，可选)
VITE_APIFY_TOKEN=your_apify_token_here

# RapidAPI Key (备选API，可选)
VITE_RAPIDAPI_KEY=your_rapidapi_key_here
```

### 8.2 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 8.3 API Key获取指南

| API | 获取地址 | 用途 |
|-----|----------|------|
| Google Gemini | https://aistudio.google.com/app/apikey | AI分析核心 |
| Rainforest API | https://www.rainforestapi.com/ | Amazon数据 |
| Apify | https://console.apify.com/account/integrations | TikTok数据 |

### 8.4 部署建议

**推荐平台**:
- **Vercel** (推荐): 与Vite完美兼容，自动CI/CD
- **Netlify**: 简单易用，免费额度充足
- **Cloudflare Pages**: 全球CDN，速度快

**注意事项**:
1. 环境变量需在部署平台配置
2. `VITE_` 前缀的变量会暴露给前端，注意安全
3. `API_KEY` (Gemini) 应通过后端代理调用

---

## 附录

### A. 常用命令速查

```bash
# 开发
npm run dev          # 启动开发服务器 (http://localhost:5173)

# 构建
npm run build        # 生产构建
npm run preview      # 预览构建结果

# 类型检查
npx tsc --noEmit     # TypeScript类型检查
```

### B. 相关资源

- [Google Gemini API 文档](https://ai.google.dev/docs)
- [Rainforest API 文档](https://www.rainforestapi.com/docs)
- [React 官方文档](https://react.dev/)
- [Vite 官方文档](https://vitejs.dev/)
- [Recharts 图表库](https://recharts.org/)
- [Lucide Icons](https://lucide.dev/)

### C. 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v2.0 | 2024-12 | 多智能体架构、Amazon/TikTok调研 |
| v1.0 | 2024-11 | 初始版本、基础对话功能 |

---

> 📝 **文档维护**: 本文档应随项目迭代持续更新  
> 🔗 **项目地址**: https://github.com/uuuqqqmmm/TradeNexu_AI  
> 📧 **反馈建议**: 请通过GitHub Issues提交
