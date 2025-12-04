
export interface TrendDataPoint {
  date: string;
  volume: number;
}

export interface ProductInsight {
  id: string;
  name: string;
  source: '全球数据库' | '竞争对手' | '海关数据';
  trendScore: number;
  complianceNote?: string; // 合规备注
  profitMargin?: string;
  description: string;
  imageUrl: string;
  tags: string[];
}

// 目录单项商品
export interface CatalogItem {
  id: string;
  name: string;
  market?: string; // 销售市场 (爆款目录用)
  requirement?: string; // 客户需求 (咨询目录用)
  recommendation?: 'High' | 'Medium' | 'Low'; // 推荐指数 (待拓展目录用)
  url?: string; // 商品链接 (新增)
}

// 产品目录结构
export interface ProductCatalog {
  hotProducts: CatalogItem[]; // 爆款产品目录
  clientInquiries: CatalogItem[]; // 客户咨询产品目录
  opportunities: CatalogItem[]; // 待拓展产品目录
}

// 代理间通信协议事件
export interface AgentProtocolEvent {
  step: number;
  from: AgentType;
  to: AgentType;
  action: 'REQUEST' | 'RESPONSE' | 'BROADCAST';
  content: string; // 传输的数据或请求内容
}

export interface AnalysisResult {
  thinking_process: string; // 思考链内容
  agentProtocolLogs: AgentProtocolEvent[]; // 新增：代理间通信日志
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
  content: string; // 显示给用户的最终文本 (summary + advice)
  thinking?: string; // 隐藏/折叠的思考过程
  data?: AnalysisResult; // 附带的数据视图（图表/卡片）
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
  protocolData?: AgentProtocolEvent; // 关联的协议数据
}

// 对应 PDF "AI 军团" 角色定义
export enum AgentType {
  GENERAL_MANAGER = 'AI 总管', 
  MARKET_INTEL = '市场情报官',
  LEAD_NURTURING = '客户开发官',
  COMPLIANCE = '贸易合规官',
  SUPPLY_CHAIN = '供应链总监'
}
