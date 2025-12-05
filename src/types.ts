
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
  // 新增字段
  dataSource?: 'real' | 'mock';  // 数据来源：真实API/模拟数据
  amazonSearchUrl?: string;      // 亚马逊搜索链接
  searchKeyword?: string;        // 搜索关键词
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

// Amazon 产品详情（Rainforest API 返回格式）
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
