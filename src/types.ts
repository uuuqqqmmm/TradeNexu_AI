
export interface TrendDataPoint {
  date: string;
  volume: number;
}

export interface ProductInsight {
  id: string;
  name: string;
  source: '全球数据库' | '竞争对手' | '海关数据';
  trendScore: number;
  complianceNote?: string;
  profitMargin?: string;
  description: string;
  imageUrl: string;
  tags: string[];
  // 数据来源字段
  dataSource?: 'real' | 'mock';  // 数据来源：真实API/模拟数据
  amazonSearchUrl?: string;      // 亚马逊搜索链接（备用）
  searchKeyword?: string;        // 搜索关键词
  // 产品详情链接
  productUrl?: string;           // 具体产品页面链接 (如 amazon.com/dp/ASIN)
  asin?: string;                 // Amazon ASIN
  price?: string;                // 产品价格
  salesVolume?: string;          // 销量标签
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  keywords: string[];
  summary: string;
}

export interface PriceHistory {
  date: string;
  price: number;
  volume?: number;
}

export interface CompetitorComparison {
  name: string;
  price: string;
  advantage: string;
  disadvantage: string;
}

export interface ProductDetails {
  title: string;
  price: string;
  sales_volume: string;
  main_image: string;
  url: string;
  platform: 'Amazon' | 'TikTok' | 'Alibaba' | 'AliExpress' | 'Other';
  rating?: number;
  reviewCount?: number;
  sentiment?: SentimentAnalysis;
  priceHistory?: PriceHistory[];
  competitors?: CompetitorComparison[];
}

export interface CatalogItem {
  id: string;
  name: string;
  market?: string;
  requirement?: string;
  recommendation?: 'High' | 'Medium' | 'Low';
  url?: string;
}

export interface ProductCatalog {
  hotProducts: CatalogItem[];
  clientInquiries: CatalogItem[];
  opportunities: CatalogItem[];
}

export interface AgentProtocolEvent {
  step: number;
  from: AgentType;
  to: AgentType;
  action: 'REQUEST' | 'RESPONSE' | 'BROADCAST';
  content: string;
}

export interface AnalysisResult {
  thinking_process: string;
  agentProtocolLogs: AgentProtocolEvent[];
  query: string;
  summary: string;
  strategicAdvice: string;
  trendData: TrendDataPoint[];
  topProducts: ProductInsight[];
  relatedKeywords: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  data?: AnalysisResult;
  timestamp: number;
}

export enum MCPToolStatus {
  IDLE = '空闲',
  RUNNING = '运行中',
  SUCCESS = '成功',
  ERROR = '错误'
}

export interface MCPLog {
  id: string;
  timestamp: string;
  toolName: string;
  status: MCPToolStatus;
  message: string;
  protocolData?: AgentProtocolEvent;
}

export enum AgentType {
  GENERAL_MANAGER = 'AI 总管',
  MARKET_INTEL = '市场情报官',
  LEAD_NURTURING = '客户开发官',
  COMPLIANCE = '贸易合规官',
  SUPPLY_CHAIN = '供应链总监'
}

// 市场调研任务接口
export interface ResearchTask {
  id: string;
  platform: 'Amazon' | 'TikTok' | 'Alibaba' | 'AliExpress';
  productQuery: string;
  status: 'pending' | 'crawling' | 'completed' | 'failed';
  progress: number; // 0-100
  createdAt: number;
  productData?: ProductDetails[];
  dataSource?: 'real' | 'mock'; // 数据来源标注
}

// Amazon 产品详情（Apify Amazon Scraper 返回格式）
export interface AmazonProductData {
  asin: string;
  title: string;
  recentSalesLabel: string | null;  // "2K+ bought in past month"
  bsr: number | null;
  bsrCategory: string | null;
  price: number | null;
  currency: string;
  mainImage: string;
  link: string;
  fetchedAt: number;
  dataSource: 'real' | 'mock';  // 标注数据来源：真实 API 或模拟数据
  // Apify 扩展字段
  rating?: number | null;
  reviewCount?: number;
  brand?: string | null;
  description?: string | null;
}

// 亚马逊调研查询参数
export interface AmazonResearchQuery {
  type: 'asin' | 'keyword' | 'url';
  value: string;
  domain: string;  // amazon.com, amazon.de, amazon.co.jp 等
}

// Amazon 站点配置
export const AMAZON_DOMAINS = [
  { label: '美国站 (amazon.com)', value: 'amazon.com' },
  { label: '德国站 (amazon.de)', value: 'amazon.de' },
  { label: '英国站 (amazon.co.uk)', value: 'amazon.co.uk' },
  { label: '日本站 (amazon.co.jp)', value: 'amazon.co.jp' },
  { label: '加拿大站 (amazon.ca)', value: 'amazon.ca' },
] as const;

// ============================================
// v3.0 新增类型定义
// ============================================

// 供应链货源信息 (1688)
export interface SourcingInfo {
  id?: string;
  supplierUrl: string;
  supplierName: string;
  costPrice: number;
  currency: string;
  moq: number;              // 最小起订量
  supplierRating: number;
  shopYears?: number;       // 开店年限
  matchScore: number;       // AI 匹配度 0-1
  imageUrl: string;
}

// 合规检查结果
export interface ComplianceCheck {
  id?: string;
  market: 'US' | 'EU' | 'SEA' | 'AU';
  hsCode?: string;
  taxRate?: number;
  certificationsRequired: string[];  // ['FDA', 'CE', 'CPC']
  riskLevel: 'low' | 'medium' | 'high';
  notes: string;
}

// 利润计算结果
export interface ProfitCalculation {
  sellPrice: number;        // 售价 (USD)
  costPrice: number;        // 采购价 (CNY)
  shippingCost: number;     // 运费 (CNY)
  platformFee: number;      // 平台佣金 (CNY)
  fbaFee: number;           // FBA 费用 (CNY)
  marketingCost: number;    // 广告费 (CNY)
  netProfit: number;        // 净利润 (CNY)
  profitMargin: number;     // 利润率 (%)
  exchangeRate: number;     // 汇率
}

// 扩展 AnalysisResult 接口 (v3.0)
export interface AnalysisResultV3 extends AnalysisResult {
  sourcingInfo?: SourcingInfo[];      // 供应链数据
  complianceCheck?: ComplianceCheck;  // 合规检查
  profitCalculation?: ProfitCalculation; // 利润计算
}

// 后台任务类型
export type JobType = 'AMAZON_SEARCH' | '1688_FIND' | 'PROFIT_CALC' | 'COMPLIANCE_CHECK' | 'AI_ANALYSIS';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

// 后台任务
export interface Job {
  id: string;
  userId: string;
  type: JobType;
  status: JobStatus;
  progress: number;         // 0-100
  inputData?: any;
  outputData?: any;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// 供应商收藏
export interface Supplier {
  id: string;
  platform: '1688' | 'alibaba';
  supplierUrl: string;
  supplierName: string;
  contactInfo?: {
    wechat?: string;
    phone?: string;
    qq?: string;
  };
  rating?: number;
  notes?: string;
  tags: string[];
  createdAt: string;
}
