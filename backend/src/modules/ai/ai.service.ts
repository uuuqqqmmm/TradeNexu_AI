/**
 * AI 分析服务 (DeepSeek V3.1 + Gemini + OpenRouter 集成)
 * 
 * 核心功能:
 * 1. 产品分析 - 调用 DeepSeek/Gemini/OpenRouter 进行市场分析
 * 2. 关键词翻译 - 英文标题转中文搜索词
 * 3. 智能体协作 - 协调各模块完成任务
 * 
 * 默认模型: DeepSeek V3.1 (通过 OpenRouter)
 * 可选模型: Gemini 2.0 Flash, DeepSeek Chat
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryService } from '../memory/memory.service';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import nodeFetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private deepseekKey: string;
  private geminiKey: string;
  private openRouterKey: string;
  private tavilyKey: string;
  private openai: OpenAI | null = null;
  private openRouter: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private httpAgent: HttpsProxyAgent<string>;
  private activeProvider: 'deepseek' | 'gemini' | 'openrouter' = 'openrouter';
  
  // Function Calling 工具定义
  private readonly SEARCH_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'web_search',
        description: '当用户询问实时新闻、天气、股价、最新事件、或者模型训练数据之后发生的事情时，使用此工具搜索互联网获取最新信息。',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '用于搜索引擎的查询关键词，应该是简洁、精准的搜索词'
            }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: '获取指定城市的实时天气信息',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: '城市名称，如：北京、上海、杭州、New York'
            }
          },
          required: ['location']
        }
      }
    }
  ];
  
  // 固定使用 DeepSeek V3.1 Nex N1 (free) 模型
  // 参考: https://openrouter.ai/docs/quickstart
  private readonly FIXED_MODEL_ID = 'nex-agi/deepseek-v3.1-nex-n1:free';
  
  // 可用模型列表（仅保留 DeepSeek V3.1）
  private readonly AVAILABLE_MODELS = {
    'deepseek-v3.1': {
      id: 'nex-agi/deepseek-v3.1-nex-n1:free',
      name: 'DeepSeek V3.1 Nex N1 (free)',
      provider: 'openrouter',
      description: '固定使用 DeepSeek V3.1 Nex N1 免费模型'
    }
  };
  
  // 当前选中的模型
  private currentModel: string = 'deepseek-v3.1';

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    @Optional() private memoryService?: MemoryService,
  ) {
    this.deepseekKey = this.config.get('DEEPSEEK_API_KEY') || '';
    this.geminiKey = this.config.get('GEMINI_API_KEY') || '';
    this.tavilyKey = this.config.get('TAVILY_API_KEY') || '';
    this.openRouterKey = this.config.get('OPENROUTER_API_KEY') || '';
    const proxyUrl = this.config.get('HTTPS_PROXY') || this.config.get('HTTP_PROXY') || 'http://127.0.0.1:7890';
    
    // 配置代理 (Clash 默认端口 7890)
    this.httpAgent = new HttpsProxyAgent(proxyUrl);
    
    // 初始化 OpenRouter (优先级最高 - 使用 Gemini 3 Pro Preview)
    if (this.openRouterKey) {
      this.openRouter = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: this.openRouterKey,
        timeout: 120000,
        defaultHeaders: {
          'HTTP-Referer': 'https://tradenexus.ai',
          'X-Title': 'TradeNexus AI',
        },
        fetch: (url: any, init: any) => {
          return nodeFetch(url, {
            ...init,
            agent: this.httpAgent,
          }) as any;
        },
      });
      this.logger.log(`OpenRouter API 已配置 (代理: ${proxyUrl}) - 默认使用 DeepSeek V3.1`);
    }
    
    // 初始化 DeepSeek
    if (this.deepseekKey) {
      this.openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: this.deepseekKey,
        timeout: 60000,
        fetch: (url: any, init: any) => {
          return nodeFetch(url, {
            ...init,
            agent: this.httpAgent,
          }) as any;
        },
      });
      this.logger.log(`DeepSeek API 已配置 (代理: ${proxyUrl})`);
    }
    
    // 初始化 Gemini (直接调用)
    if (this.geminiKey) {
      this.gemini = new GoogleGenerativeAI(this.geminiKey);
      this.logger.log(`Gemini API 已配置 (代理: ${proxyUrl})`);
    }
    
    // 决定默认使用哪个 Provider (优先级: OpenRouter > Gemini > DeepSeek)
    if (this.openRouterKey) {
      this.activeProvider = 'openrouter';
    } else if (this.geminiKey) {
      this.activeProvider = 'gemini';
    } else if (this.deepseekKey) {
      this.activeProvider = 'deepseek';
    } else {
      this.logger.warn('未配置任何 AI API Key (OPENROUTER_API_KEY, GEMINI_API_KEY 或 DEEPSEEK_API_KEY)');
    }
    
    // 日志输出搜索服务状态
    if (this.tavilyKey) {
      this.logger.log('✅ Tavily 搜索服务已配置 - 支持实时互联网搜索');
    } else {
      this.logger.warn('⚠️ TAVILY_API_KEY 未配置 - 实时搜索功能不可用');
    }
  }

  /**
   * 使用 Tavily API 进行互联网搜索
   * Tavily 是专为 AI Agent 设计的搜索 API，返回清洗好的纯文本
   */
  async tavilySearch(query: string, options?: { maxResults?: number; searchDepth?: 'basic' | 'advanced' }): Promise<{
    results: Array<{ title: string; url: string; content: string; score: number }>;
    context: string;
  }> {
    if (!this.tavilyKey) {
      throw new Error('TAVILY_API_KEY 未配置');
    }
    
    const maxResults = options?.maxResults || 5;
    const searchDepth = options?.searchDepth || 'basic';
    
    this.logger.log(`🔍 Tavily 搜索: "${query}" (depth: ${searchDepth}, max: ${maxResults})`);
    
    try {
      const response = await nodeFetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.tavilyKey,
          query,
          search_depth: searchDepth,
          max_results: maxResults,
          include_answer: true,
          include_raw_content: false,
        }),
        agent: this.httpAgent,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily API 错误: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json() as any;
      
      // 提取搜索结果
      const results = (data.results || []).map((r: any) => ({
        title: r.title || '',
        url: r.url || '',
        content: r.content || '',
        score: r.score || 0,
      }));
      
      // 构建上下文文本（用于注入到 AI 对话）
      const contextParts = results.map((r: any, i: number) => 
        `[${i + 1}] ${r.title}\n来源: ${r.url}\n摘要: ${r.content}`
      );
      const context = contextParts.join('\n\n---\n\n');
      
      this.logger.log(`✅ Tavily 搜索完成，找到 ${results.length} 条结果`);
      
      return { results, context };
    } catch (error: any) {
      this.logger.error(`Tavily 搜索失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 检测查询类型 - 区分外贸业务问题和实时信息查询
   */
  private detectQueryType(query: string): 'business' | 'realtime' | 'general' {
    // 外贸业务关键词
    const businessKeywords = [
      '外贸', '跨境', '电商', '亚马逊', 'amazon', '选品', '产品分析',
      '市场调研', '供应链', '供应商', '1688', '阿里巴巴', '货源',
      '关税', '合规', 'HS编码', '清关', '物流', '海运', '空运',
      'FBA', 'listing', '运营', '广告', 'PPC', '站外推广',
      '利润', '成本', '定价', '竞品', '差异化', 'OEM', 'ODM'
    ];
    
    // 实时信息关键词
    const realtimeKeywords = [
      '天气', '股价', '股票', '新闻', '最新', '今天', '现在',
      '实时', '当前', '最近', '发布', '上市', '价格', '汇率',
      'weather', 'stock', 'news', 'latest', 'today', 'current'
    ];
    
    const lowerQuery = query.toLowerCase();
    
    // 检测外贸业务问题
    if (businessKeywords.some(kw => lowerQuery.includes(kw.toLowerCase()))) {
      return 'business';
    }
    
    // 检测实时信息查询
    if (realtimeKeywords.some(kw => lowerQuery.includes(kw.toLowerCase()))) {
      return 'realtime';
    }
    
    return 'general';
  }

  /**
   * 获取可用模型列表
   */
  getAvailableModels() {
    return Object.entries(this.AVAILABLE_MODELS).map(([key, model]) => ({
      key,
      ...model,
      available: this.isModelAvailable(key)
    }));
  }

  /**
   * 检查模型是否可用
   */
  private isModelAvailable(modelKey: string): boolean {
    const model = this.AVAILABLE_MODELS[modelKey as keyof typeof this.AVAILABLE_MODELS];
    if (!model) return false;
    
    switch (model.provider) {
      case 'openrouter': return !!this.openRouter;
      case 'deepseek': return !!this.openai;
      case 'gemini': return !!this.gemini;
      default: return false;
    }
  }

  /**
   * 设置当前模型
   */
  setCurrentModel(modelKey: string) {
    if (this.AVAILABLE_MODELS[modelKey as keyof typeof this.AVAILABLE_MODELS]) {
      this.currentModel = modelKey;
      this.logger.log(`模型已切换为: ${modelKey}`);
      return true;
    }
    return false;
  }

  /**
   * 获取当前模型
   */
  getCurrentModel() {
    return {
      key: this.currentModel,
      ...this.AVAILABLE_MODELS[this.currentModel as keyof typeof this.AVAILABLE_MODELS]
    };
  }

  /**
   * AI 对话 - 通用聊天接口（支持模型选择）
   */
  async chat(query: string, history: { role: string; content: string }[] = [], provider?: 'deepseek' | 'gemini' | 'openrouter', modelKey?: string) {
    // 如果指定了模型，使用该模型
    const selectedModel = modelKey || this.currentModel;
    const modelConfig = this.AVAILABLE_MODELS[selectedModel as keyof typeof this.AVAILABLE_MODELS];
    
    if (modelConfig) {
      const modelProvider = modelConfig.provider as 'deepseek' | 'gemini' | 'openrouter';
      
      if (modelProvider === 'openrouter' && this.openRouter) {
        return this.chatWithOpenRouter(query, history, modelConfig.id);
      }
      if (modelProvider === 'gemini' && this.gemini) {
        return this.chatWithGemini(query, history);
      }
      if (modelProvider === 'deepseek' && this.openai) {
        return this.chatWithDeepSeek(query, history);
      }
    }
    
    const useProvider = provider || this.activeProvider;
    
    // 使用默认 Provider
    if (useProvider === 'openrouter' && this.openRouter) {
      return this.chatWithOpenRouter(query, history);
    }
    
    if (useProvider === 'gemini' && this.gemini) {
      return this.chatWithGemini(query, history);
    }
    
    if (!this.openai) {
      // 如果 DeepSeek 不可用，尝试 OpenRouter 或 Gemini
      if (this.openRouter) {
        return this.chatWithOpenRouter(query, history);
      }
      if (this.gemini) {
        return this.chatWithGemini(query, history);
      }
      throw new Error('未配置任何 AI API Key');
    }

    const systemPrompt = `
你是由"外贸AI军团"架构驱动的【AI总管 (General Manager)】，一个智能助手。

【核心身份】:
你既是专业的外贸市场分析专家，也是一个友好、有温度的AI助手。

【团队成员】:
1. 市场情报官: 负责趋势、数据、选品。
2. 客户开发官: 负责邮件、CRM、Lead。
3. 贸易合规官: 负责法律、税务、HS编码。
4. 供应链总监: 负责物流、供应商、库存。

【智能判断】:
首先判断用户问题的类型：
- 如果是【外贸业务相关】（产品分析、市场调研、选品建议、跨境电商、供应链、合规、关税等），返回结构化的 JSON 分析。
- 如果是【普通对话】（问候、天气、闲聊、生活问题等），以友好自然的方式回复，同时可以适当引导到外贸话题。

【输出格式】:
1. 对于【外贸业务问题】，返回 JSON:
{
  "isBusinessQuery": true,
  "thinking_process": "详细的思维链推理过程",
  "agentProtocolLogs": [{ "step": 1, "from": "AI 总管", "to": "市场情报官", "action": "REQUEST", "content": "请求内容" }],
  "query": "用户原始查询",
  "summary": "针对用户问题的专业分析摘要",
  "strategicAdvice": "具体可执行的战略建议",
  "trendData": [{ "date": "2024-01", "volume": 1000 }],
  "topProducts": [{ "id": "产品ID", "name": "产品名称", "source": "AI分析", "trendScore": 85, "profitMargin": "35%", "description": "产品描述", "imageUrl": "", "tags": ["标签"], "dataSource": "ai", "price": "$99.99" }],
  "relatedKeywords": ["关键词1", "关键词2"]
}

2. 对于【普通对话问题】，返回 JSON:
{
  "isBusinessQuery": false,
  "thinking_process": "判断这是普通对话，友好回复",
  "query": "用户原始查询",
  "summary": "友好、自然的回复内容，可以幽默风趣，像朋友一样交流。如果合适，可以自然地引导话题到外贸领域。",
  "strategicAdvice": "",
  "trendData": [],
  "topProducts": [],
  "relatedKeywords": [],
  "agentProtocolLogs": []
}

【重要原则】:
- 无论什么问题，都要友好、有温度地回复，不要生硬拒绝
- 对于非业务问题，可以正常聊天，展示你的智慧和幽默
- 如果用户问天气、新闻等实时信息，坦诚说明你无法获取实时数据，但可以给出建议
- dataSource 字段必须设置为 "ai"
`;

    try {
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: query }
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      });

      const text = completion.choices[0]?.message?.content || '';
      this.logger.log(`DeepSeek 响应长度: ${text.length}`);

      // 尝试解析 JSON
      try {
        const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(jsonText);
      } catch (parseError) {
        this.logger.warn('JSON 解析失败，返回原始文本');
        return {
          thinking_process: text,
          query,
          summary: text.substring(0, 200),
          strategicAdvice: '',
          trendData: [],
          topProducts: [],
          relatedKeywords: [],
          agentProtocolLogs: [],
        };
      }
    } catch (error: any) {
      this.logger.error(`DeepSeek API 调用失败: ${error.message}`);
      
      // 网络超时或连接失败时返回模拟数据
      if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED') || error.message?.includes('network')) {
        this.logger.warn('网络问题，返回模拟数据');
        return {
          thinking_process: `[网络超时] 无法连接到 DeepSeek API，当前返回模拟分析结果。\n\n针对您的查询"${query}"，AI军团正在待命中...`,
          query,
          summary: `针对"${query}"的市场分析（模拟数据）`,
          strategicAdvice: '建议：1. 检查网络连接 2. 确认 API Key 有效 3. 稍后重试',
          trendData: [
            { date: '2024-01', volume: 1000 },
            { date: '2024-02', volume: 1200 },
            { date: '2024-03', volume: 1500 },
          ],
          topProducts: [],
          relatedKeywords: ['市场分析', '产品调研'],
          agentProtocolLogs: [
            { step: 1, from: 'AI 总管', to: '系统', action: 'ERROR', content: 'DeepSeek API 连接超时' }
          ],
        };
      }
      throw error;
    }
  }

  /**
   * 使用 DeepSeek 原生 API 进行对话
   */
  private async chatWithDeepSeek(query: string, history: { role: string; content: string }[] = []) {
    if (!this.openai) {
      throw new Error('DEEPSEEK_API_KEY 未配置');
    }
    // 复用 chat 方法中的 DeepSeek 逻辑
    return this.chat(query, history, 'deepseek');
  }

  /**
   * 使用 OpenRouter 进行对话（支持多模型）
   * 参考: https://openrouter.ai/docs/quickstart
   */
  private async chatWithOpenRouter(query: string, history: { role: string; content: string }[] = [], modelId?: string) {
    if (!this.openRouter) {
      throw new Error('OPENROUTER_API_KEY 未配置');
    }
    
    // 默认使用 DeepSeek V3.1
    const model = modelId || 'nex-agi/deepseek-v3.1-nex-n1:free';

    const systemPrompt = `
你是由"外贸AI军团"架构驱动的【AI总管 (General Manager)】，一个智能助手。

【核心身份】:
你既是专业的外贸市场分析专家，也是一个友好、有温度的AI助手。

【团队成员】:
1. 市场情报官: 负责趋势、数据、选品。
2. 客户开发官: 负责邮件、CRM、Lead。
3. 贸易合规官: 负责法律、税务、HS编码。
4. 供应链总监: 负责物流、供应商、库存。

【智能判断】:
首先判断用户问题的类型：
- 如果是【外贸业务相关】（产品分析、市场调研、选品建议、跨境电商、供应链、合规、关税等），返回结构化的 JSON 分析。
- 如果是【普通对话】（问候、天气、闲聊、生活问题等），以友好自然的方式回复，同时可以适当引导到外贸话题。

【输出格式】:
1. 对于【外贸业务问题】，返回 JSON:
{
  "isBusinessQuery": true,
  "thinking_process": "详细的思维链推理过程",
  "agentProtocolLogs": [{ "step": 1, "from": "AI 总管", "to": "市场情报官", "action": "REQUEST", "content": "请求内容" }],
  "query": "用户原始查询",
  "summary": "针对用户问题的专业分析摘要",
  "strategicAdvice": "具体可执行的战略建议",
  "trendData": [{ "date": "2024-01", "volume": 1000 }],
  "topProducts": [{ "id": "产品ID", "name": "产品名称", "source": "AI分析", "trendScore": 85, "profitMargin": "35%", "description": "产品描述", "imageUrl": "", "tags": ["标签"], "dataSource": "ai", "price": "$99.99" }],
  "relatedKeywords": ["关键词1", "关键词2"]
}

2. 对于【普通对话问题】，返回 JSON:
{
  "isBusinessQuery": false,
  "thinking_process": "判断这是普通对话，友好回复",
  "query": "用户原始查询",
  "summary": "友好、自然的回复内容，可以幽默风趣，像朋友一样交流。如果合适，可以自然地引导话题到外贸领域。",
  "strategicAdvice": "",
  "trendData": [],
  "topProducts": [],
  "relatedKeywords": [],
  "agentProtocolLogs": []
}

【重要原则】:
- 无论什么问题，都要友好、有温度地回复，不要生硬拒绝
- 对于非业务问题，可以正常聊天，展示你的智慧和幽默
- 如果用户问天气、新闻等实时信息，坦诚说明你无法获取实时数据，但可以给出建议
- dataSource 字段必须设置为 "ai"
`;

    try {
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: query }
      ];

      this.logger.log(`调用 OpenRouter API (${model})...`);
      
      const completion = await this.openRouter.chat.completions.create({
        model: model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      });

      const content = completion.choices[0]?.message?.content || '';
      this.logger.log(`OpenRouter 响应长度: ${content.length}`);

      // 尝试解析 JSON
      try {
        const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(jsonText);
      } catch (parseError) {
        this.logger.warn('OpenRouter JSON 解析失败，返回原始文本');
        return {
          thinking_process: content,
          query,
          summary: content.substring(0, 200),
          strategicAdvice: '',
          trendData: [],
          topProducts: [],
          relatedKeywords: [],
          agentProtocolLogs: [],
        };
      }
    } catch (error: any) {
      this.logger.error(`OpenRouter API 调用失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 使用 Gemini 进行对话（通过代理 REST API）
   * 参考: https://ai.google.dev/gemini-api/docs/api-key
   */
  private async chatWithGemini(query: string, history: { role: string; content: string }[] = []) {
    if (!this.geminiKey) {
      throw new Error('GEMINI_API_KEY 未配置');
    }

    const systemPrompt = `
你是由"外贸AI军团"架构驱动的【AI总管 (General Manager)】，一个智能助手。

【核心身份】:
你既是专业的外贸市场分析专家，也是一个友好、有温度的AI助手。

【团队成员】:
1. 市场情报官: 负责趋势、数据、选品。
2. 客户开发官: 负责邮件、CRM、Lead。
3. 贸易合规官: 负责法律、税务、HS编码。
4. 供应链总监: 负责物流、供应商、库存。

【智能判断】:
首先判断用户问题的类型：
- 如果是【外贸业务相关】，返回结构化的 JSON 分析。
- 如果是【普通对话】，以友好自然的方式回复。

【输出格式】:
1. 对于【外贸业务问题】，返回 JSON:
{
  "isBusinessQuery": true,
  "thinking_process": "详细的思维链推理过程",
  "agentProtocolLogs": [{ "step": 1, "from": "AI 总管", "to": "市场情报官", "action": "REQUEST", "content": "请求内容" }],
  "query": "用户原始查询",
  "summary": "针对用户问题的专业分析摘要",
  "strategicAdvice": "具体可执行的战略建议",
  "trendData": [{ "date": "2024-01", "volume": 1000 }],
  "topProducts": [{ "id": "产品ID", "name": "产品名称", "source": "AI分析", "trendScore": 85, "profitMargin": "35%", "description": "产品描述", "imageUrl": "", "tags": ["标签"], "dataSource": "ai", "price": "$99.99" }],
  "relatedKeywords": ["关键词1", "关键词2"]
}

2. 对于【普通对话问题】，返回 JSON:
{
  "isBusinessQuery": false,
  "thinking_process": "判断这是普通对话，友好回复",
  "query": "用户原始查询",
  "summary": "友好、自然的回复内容",
  "strategicAdvice": "",
  "trendData": [],
  "topProducts": [],
  "relatedKeywords": [],
  "agentProtocolLogs": []
}

【重要原则】:
- 无论什么问题，都要友好、有温度地回复，不要生硬拒绝
- dataSource 字段必须设置为 "ai"
`;

    try {
      // 使用 REST API 直接调用 Gemini（通过代理）
      const historyContent = history.map(h => `${h.role}: ${h.content}`).join('\n');
      const fullPrompt = `${systemPrompt}\n\n历史对话:\n${historyContent}\n\n用户: ${query}`;

      // 使用 gemini-2.0-flash 模型（支持 generateContent）
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiKey}`;
      
      // 重试逻辑（处理 429 Rate Limit）
      let response: any;
      let retries = 3;
      while (retries > 0) {
        response = await nodeFetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: fullPrompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            }
          }),
          agent: this.httpAgent,
        });

        if (response.status === 429) {
          retries--;
          if (retries > 0) {
            this.logger.warn(`Gemini 429 Rate Limit，等待 10 秒后重试 (剩余 ${retries} 次)`);
            await new Promise(r => setTimeout(r, 10000));
            continue;
          }
        }
        break;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API 错误 ${response.status}: ${errorText}`);
      }

      const data = await response.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      this.logger.log(`Gemini 响应长度: ${text.length}`);

      // 尝试解析 JSON
      try {
        const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(jsonText);
      } catch (parseError) {
        this.logger.warn('Gemini JSON 解析失败，返回原始文本');
        return {
          thinking_process: text,
          query,
          summary: text.substring(0, 200),
          strategicAdvice: '',
          trendData: [],
          topProducts: [],
          relatedKeywords: [],
          agentProtocolLogs: [],
        };
      }
    } catch (error: any) {
      this.logger.error(`Gemini API 调用失败: ${error.message}`);
      
      // 429 Rate Limit 或其他错误时返回模拟数据
      if (error.message?.includes('429') || error.message?.includes('Rate Limit')) {
        this.logger.warn('Gemini Rate Limit，返回模拟数据');
        return {
          thinking_process: `[Gemini Rate Limit] 当前请求频率超限，返回模拟分析结果。\n\n针对您的查询"${query}"，AI军团正在待命中...`,
          query,
          summary: `针对"${query}"的市场分析（模拟数据 - Gemini 频率限制）`,
          strategicAdvice: '建议：1. 稍后重试 2. 升级 Gemini API 配额 3. 使用 DeepSeek 作为备选',
          trendData: [
            { date: '2024-01', volume: 1000 },
            { date: '2024-02', volume: 1200 },
            { date: '2024-03', volume: 1500 },
          ],
          topProducts: [],
          relatedKeywords: ['市场分析', '产品调研'],
          agentProtocolLogs: [
            { step: 1, from: 'AI 总管', to: '系统', action: 'ERROR', content: 'Gemini API 频率限制' }
          ],
        };
      }
      throw error;
    }
  }

  /**
   * 获取天气信息 - 使用 wttr.in 免费 API
   */
  async getWeather(location: string): Promise<{
    location: string;
    current: string;
    temperature: string;
    humidity: string;
    wind: string;
    forecast: string[];
    rawData?: any;
  }> {
    try {
      // 使用 wttr.in 免费天气 API（支持中文城市名）
      const encodedLocation = encodeURIComponent(location);
      const url = `https://wttr.in/${encodedLocation}?format=j1&lang=zh`;
      
      this.logger.log(`获取天气信息: ${location}`);
      
      const response = await nodeFetch(url, {
        agent: this.httpAgent,
        headers: {
          'User-Agent': 'TradeNexus-AI/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`天气 API 响应错误: ${response.status}`);
      }
      
      const data = await response.json() as any;
      
      // 获取中国时区的当前日期 (UTC+8)
      const now = new Date();
      const chinaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
      const todayStr = chinaTime.toISOString().split('T')[0]; // YYYY-MM-DD 格式
      
      // 解析天气数据
      const current = data.current_condition?.[0] || {};
      const weatherDesc = current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || '未知';
      
      // 过滤掉过去的日期，只保留今天及以后的预报
      const forecast = data.weather?.filter((day: any) => day.date >= todayStr).slice(0, 3).map((day: any) => {
        const date = day.date;
        const maxTemp = day.maxtempC;
        const minTemp = day.mintempC;
        const desc = day.hourly?.[4]?.lang_zh?.[0]?.value || day.hourly?.[4]?.weatherDesc?.[0]?.value || '未知';
        // 格式化日期为中文格式
        const [year, month, dayNum] = date.split('-');
        const formattedDate = `${parseInt(month)}月${parseInt(dayNum)}日`;
        return `${formattedDate}: ${desc}, ${minTemp}°C ~ ${maxTemp}°C`;
      }) || [];
      
      return {
        location: data.nearest_area?.[0]?.areaName?.[0]?.value || location,
        current: weatherDesc,
        temperature: `${current.temp_C}°C (体感 ${current.FeelsLikeC}°C)`,
        humidity: `${current.humidity}%`,
        wind: `${current.windspeedKmph} km/h ${current.winddir16Point}`,
        forecast,
        rawData: data
      };
    } catch (error: any) {
      this.logger.error(`获取天气失败: ${error.message}`);
      throw new Error(`无法获取 ${location} 的天气信息: ${error.message}`);
    }
  }

  /**
   * 检测查询是否为天气相关
   */
  private detectWeatherQuery(query: string): { isWeather: boolean; location?: string } {
    const weatherPatterns = [
      /(.+?)(?:的)?天气(?:怎么样|如何|情况)?/,
      /(?:查询?|看看|告诉我)?(.+?)(?:的)?(?:今天|明天|这周|最近)?天气/,
      /天气(.+)/,
      /weather\s+(?:in\s+)?(.+)/i,
      /(.+?)\s+weather/i,
    ];
    
    for (const pattern of weatherPatterns) {
      const match = query.match(pattern);
      if (match) {
        const location = match[1]?.trim();
        if (location && location.length > 0 && location.length < 50) {
          return { isWeather: true, location };
        }
      }
    }
    
    // 简单关键词检测
    if (query.includes('天气') || query.toLowerCase().includes('weather')) {
      // 尝试提取城市名
      const cityMatch = query.match(/([^\s，。？！]+?)(?:市|省|区|县)?(?:的)?天气/);
      if (cityMatch) {
        return { isWeather: true, location: cityMatch[1] };
      }
      return { isWeather: true, location: undefined };
    }
    
    return { isWeather: false };
  }

  /**
   * 智能对话 - Search-RAG 架构
   * 使用 Function Calling 让 AI 自主决定何时搜索互联网
   */
  async smartChat(query: string, history: { role: string; content: string }[] = [], modelKey?: string, webSearchMode: 'auto' | 'on' | 'off' = 'auto') {
    const queryType = this.detectQueryType(query);
    const logs: any[] = [];
    
    // 根据用户设置的联网模式决定是否启用搜索
    const enableWebSearch = webSearchMode === 'on' || (webSearchMode === 'auto' && queryType === 'realtime');
    const webSearchModeText = webSearchMode === 'on' ? '强制开启' : webSearchMode === 'off' ? '已关闭' : '自动';
    
    this.logger.log(`📝 查询类型: ${queryType}, 联网模式: ${webSearchModeText}, 问题: "${query.substring(0, 50)}..."`);
    logs.push({ step: 1, from: 'AI 总管', to: '路由层', action: 'CLASSIFY', content: `查询类型: ${queryType}, 联网: ${webSearchModeText}` });

    // Titans 长期记忆: 混合检索
    let memoryContext = '';
    if (this.memoryService) {
      try {
        logs.push({ step: 2, from: 'AI 总管', to: '记忆系统', action: 'REQUEST', content: '查询长期记忆...' });
        const memories = await this.memoryService.hybridSearch(query, {
          productType: this.extractProductType(query),
          route: this.extractRoute(query),
          country: this.extractCountry(query),
        });
        memoryContext = this.memoryService.assembleMemoryContext(memories);
        if (memoryContext) {
          logs.push({ step: 3, from: '记忆系统', to: 'AI 总管', action: 'RESPONSE', content: '已加载长期记忆上下文' });
          this.logger.log(`🧠 已加载长期记忆上下文 (${memoryContext.length} 字符)`);
        }
      } catch (e: any) {
        this.logger.warn(`记忆检索失败: ${e.message}`);
      }
    }

    // 如果关闭联网搜索，或者是外贸业务问题且不强制联网
    if (webSearchMode === 'off' || (queryType === 'business' && webSearchMode !== 'on')) {
      logs.push({ step: 2, from: '路由层', to: 'AI 总管', action: 'ROUTE', content: webSearchMode === 'off' ? '联网已关闭，使用本地知识' : '路由到外贸专业分析' });
      const result = await this.chat(query, history, undefined, modelKey);
      return { ...result, agentProtocolLogs: [...logs, ...(result.agentProtocolLogs || [])] };
    }

    // 实时信息查询或强制联网 - 使用 Function Calling 让 AI 决定是否搜索
    if (!this.openRouter && !this.openai) {
      return this.chat(query, history, undefined, modelKey);
    }

    const client = this.openRouter || this.openai!;
    // 固定使用 DeepSeek V3.1 Nex N1 (free)，忽略 modelKey 参数
    const modelId = this.FIXED_MODEL_ID;

    // 构建带工具的系统提示
    const systemPrompt = `你是一个智能助手，具有访问互联网的能力。

【核心能力】:
1. 当用户询问实时信息（天气、新闻、股价、最新事件等）时，使用 web_search 工具搜索互联网
2. 当用户询问天气时，使用 get_weather 工具获取实时天气
3. 对于一般性问题，直接回答即可

【回复原则】:
- 如果使用了搜索，请在回答中标注信息来源 [1]、[2] 等
- 回答要友好、自然、有温度
- 如果是外贸相关问题，可以提供专业建议

【输出格式】:
返回 JSON:
{
  "isBusinessQuery": false,
  "isRealTimeData": true/false,
  "thinking_process": "思考过程",
  "query": "原始问题",
  "summary": "回答内容（支持 Markdown）",
  "sources": [{"title": "来源标题", "url": "链接"}],
  "strategicAdvice": "",
  "trendData": [],
  "topProducts": [],
  "relatedKeywords": []
}`;

    try {
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: query }
      ];

      logs.push({ step: 2, from: '路由层', to: 'DeepSeek', action: 'REQUEST', content: '发送请求（带工具）' });

      // 第一轮：让 AI 决定是否需要调用工具
      const firstResponse = await client.chat.completions.create({
        model: modelId,
        messages,
        tools: this.tavilyKey ? this.SEARCH_TOOLS : undefined,
        tool_choice: this.tavilyKey ? 'auto' : undefined,
        temperature: 0.7,
        max_tokens: 4096,
      });

      const responseMessage = firstResponse.choices[0]?.message;

      // 检查是否触发了工具调用
      if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCalls = responseMessage.tool_calls as any[];
        logs.push({ step: 3, from: 'DeepSeek', to: 'AI 总管', action: 'TOOL_CALL', content: `触发工具: ${toolCalls.map(t => t.function?.name || 'unknown').join(', ')}` });

        // 处理所有工具调用
        const toolResults: any[] = [];
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function?.name;
          const functionArgs = JSON.parse(toolCall.function?.arguments || '{}');

          if (functionName === 'web_search') {
            logs.push({ step: logs.length + 1, from: 'AI 总管', to: 'Tavily', action: 'SEARCH', content: `搜索: ${functionArgs.query}` });
            try {
              const searchResult = await this.tavilySearch(functionArgs.query);
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: `搜索结果:\n${searchResult.context}`
              });
              logs.push({ step: logs.length + 1, from: 'Tavily', to: 'AI 总管', action: 'RESPONSE', content: `找到 ${searchResult.results.length} 条结果` });
              
              // Titans 长期记忆: 自动保存搜索结果到知识库
              if (this.memoryService && searchResult.results?.length > 0) {
                try {
                  logs.push({ step: logs.length + 1, from: 'AI 总管', to: '记忆系统', action: 'SAVE', content: '保存搜索结果到知识库...' });
                  for (const result of searchResult.results.slice(0, 3)) {
                    const category = this.detectKnowledgeCategory(functionArgs.query);
                    const validCategory = ['regulation', 'contract', 'product_spec', 'tariff'].includes(category) 
                      ? category as 'regulation' | 'contract' | 'product_spec' | 'tariff'
                      : 'regulation';
                    await this.memoryService.saveKnowledge({
                      title: result.title || functionArgs.query,
                      content: result.content || '',
                      category: validCategory,
                      source: result.url,
                      version: new Date().getFullYear().toString(),
                    });
                  }
                  logs.push({ step: logs.length + 1, from: '记忆系统', to: 'AI 总管', action: 'SAVED', content: `已保存 ${Math.min(3, searchResult.results.length)} 条到长期记忆` });
                  this.logger.log(`🧠 已保存 ${Math.min(3, searchResult.results.length)} 条搜索结果到长期记忆`);
                } catch (memError: any) {
                  this.logger.warn(`保存到记忆系统失败: ${memError.message}`);
                }
              }
            } catch (error: any) {
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: `搜索失败: ${error.message}`
              });
            }
          } else if (functionName === 'get_weather') {
            logs.push({ step: logs.length + 1, from: 'AI 总管', to: '天气服务', action: 'REQUEST', content: `查询: ${functionArgs.location}` });
            try {
              const weatherData = await this.getWeather(functionArgs.location);
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: `${weatherData.location}天气:\n当前: ${weatherData.current}\n温度: ${weatherData.temperature}\n湿度: ${weatherData.humidity}\n风力: ${weatherData.wind}\n\n未来预报:\n${weatherData.forecast.join('\n')}`
              });
              logs.push({ step: logs.length + 1, from: '天气服务', to: 'AI 总管', action: 'RESPONSE', content: '天气数据获取成功' });
            } catch (error: any) {
              toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                content: `获取天气失败: ${error.message}`
              });
            }
          }
        }

        // 第二轮：将工具结果注入，让 AI 生成最终回答
        messages.push(responseMessage);
        messages.push(...toolResults);

        logs.push({ step: logs.length + 1, from: 'AI 总管', to: 'DeepSeek', action: 'GENERATE', content: '基于搜索结果生成回答' });

        const finalResponse = await client.chat.completions.create({
          model: modelId,
          messages,
          temperature: 0.7,
          max_tokens: 4096,
        });

        const finalContent = finalResponse.choices[0]?.message?.content || '';
        
        // 尝试解析 JSON
        try {
          const jsonText = finalContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            // 确保数组字段是数组类型
            return {
              ...result,
              isRealTimeData: true,
              trendData: Array.isArray(result.trendData) ? result.trendData : [],
              topProducts: Array.isArray(result.topProducts) ? result.topProducts : [],
              relatedKeywords: Array.isArray(result.relatedKeywords) ? result.relatedKeywords : [],
              agentProtocolLogs: logs
            };
          }
        } catch (e) {
          // JSON 解析失败，返回原始文本
        }

        return {
          isBusinessQuery: false,
          isRealTimeData: true,
          thinking_process: '使用实时搜索获取信息',
          query,
          summary: finalContent,
          strategicAdvice: '',
          trendData: [],
          topProducts: [],
          relatedKeywords: [],
          agentProtocolLogs: logs
        };
      }

      // 没有触发标准 Function Calling，检查是否有 XML 格式的 tool_call
      const content = responseMessage?.content || '';
      
      // 检测 DeepSeek 的 XML 格式 tool_call（多种格式兼容）
      // 格式1: <function=web_search><parameter=query>...</parameter></function>
      // 格式2: <function=web search><parameter=query>...</parameter></function> (带空格)
      // 格式3: 多行格式，参数值可能包含换行
      this.logger.log(`🔍 检查 XML tool_call, 内容长度: ${content.length}, 包含 tool_call: ${content.includes('<tool_call>')}`);
      
      // 如果内容包含 tool_call 标签，打印前200字符用于调试
      if (content.includes('<tool_call>')) {
        this.logger.log(`📋 XML 内容预览: ${content.substring(0, 300).replace(/\n/g, '\\n')}`);
      }
      
      // 更宽松的正则表达式，支持多行和各种空白字符
      // 尝试多种匹配模式
      let xmlToolCallMatch = content.match(/<tool_call>[\s\S]*?<function=([^>]+)>[\s\S]*?<parameter=(\w+)>([\s\S]*?)<\/parameter>[\s\S]*?<\/function>[\s\S]*?<\/tool_call>/i);
      
      // 备用模式：更简单的匹配
      if (!xmlToolCallMatch && content.includes('<tool_call>')) {
        // 尝试提取函数名和参数
        const funcMatch = content.match(/<function=([^>]+)>/i);
        const paramMatch = content.match(/<parameter=(\w+)>([\s\S]*?)<\/parameter>/i);
        if (funcMatch && paramMatch) {
          xmlToolCallMatch = [content, funcMatch[1], paramMatch[1], paramMatch[2]];
          this.logger.log(`📋 使用备用正则匹配成功`);
        }
      }
      
      if (xmlToolCallMatch && this.tavilyKey) {
        // 标准化函数名：去除空格，转为下划线格式
        const rawFunctionName = xmlToolCallMatch[1]?.trim() || '';
        const functionName = rawFunctionName.replace(/\s+/g, '_').toLowerCase();
        const paramName = xmlToolCallMatch[2] || 'query';
        const paramValue = xmlToolCallMatch[3]?.trim();
        
        this.logger.log(`检测到 XML 格式 tool_call: ${rawFunctionName} -> ${functionName}, ${paramName}=${paramValue}`);
        logs.push({ step: 3, from: 'DeepSeek', to: 'AI 总管', action: 'TOOL_CALL', content: `触发工具: ${functionName}` });
        
        let toolResult = '';
        
        if (functionName === 'web_search' && paramValue) {
          logs.push({ step: logs.length + 1, from: 'AI 总管', to: 'Tavily', action: 'SEARCH', content: `搜索: ${paramValue}` });
          try {
            const searchResult = await this.tavilySearch(paramValue);
            toolResult = `搜索结果:\n${searchResult.context}`;
            logs.push({ step: logs.length + 1, from: 'Tavily', to: 'AI 总管', action: 'RESPONSE', content: `找到 ${searchResult.results.length} 条结果` });
            
            // Titans 长期记忆: 自动保存搜索结果到知识库
            if (this.memoryService && searchResult.results?.length > 0) {
              try {
                logs.push({ step: logs.length + 1, from: 'AI 总管', to: '记忆系统', action: 'SAVE', content: '保存搜索结果到知识库...' });
                for (const result of searchResult.results.slice(0, 3)) {
                  const category = this.detectKnowledgeCategory(paramValue);
                  const validCategory = ['regulation', 'contract', 'product_spec', 'tariff'].includes(category) 
                    ? category as 'regulation' | 'contract' | 'product_spec' | 'tariff'
                    : 'regulation';
                  await this.memoryService.saveKnowledge({
                    title: result.title || paramValue,
                    content: result.content || '',
                    category: validCategory,
                    source: result.url,
                    version: new Date().getFullYear().toString(),
                  });
                }
                logs.push({ step: logs.length + 1, from: '记忆系统', to: 'AI 总管', action: 'RESPONSE', content: `已保存 ${Math.min(3, searchResult.results.length)} 条知识到长期记忆` });
                this.logger.log(`🧠 已保存 ${Math.min(3, searchResult.results.length)} 条搜索结果到长期记忆`);
              } catch (memError: any) {
                this.logger.warn(`保存到记忆系统失败: ${memError.message}`);
              }
            }
          } catch (error: any) {
            toolResult = `搜索失败: ${error.message}`;
          }
        } else if (functionName === 'get_weather' && paramValue) {
          logs.push({ step: logs.length + 1, from: 'AI 总管', to: '天气服务', action: 'REQUEST', content: `查询: ${paramValue}` });
          try {
            const weatherData = await this.getWeather(paramValue);
            toolResult = `${weatherData.location}天气:\n当前: ${weatherData.current}\n温度: ${weatherData.temperature}\n湿度: ${weatherData.humidity}\n风力: ${weatherData.wind}\n\n未来预报:\n${weatherData.forecast.join('\n')}`;
            logs.push({ step: logs.length + 1, from: '天气服务', to: 'AI 总管', action: 'RESPONSE', content: '天气数据获取成功' });
          } catch (error: any) {
            toolResult = `获取天气失败: ${error.message}`;
          }
        }
        
        if (toolResult) {
          // 第二轮：将工具结果注入，让 AI 生成最终回答
          messages.push({ role: 'assistant', content });
          messages.push({ role: 'user', content: `工具执行结果:\n${toolResult}\n\n请根据以上信息回答用户的问题，用中文回复，不要再调用工具。` });
          
          logs.push({ step: logs.length + 1, from: 'AI 总管', to: 'DeepSeek', action: 'GENERATE', content: '基于搜索结果生成回答' });
          
          const finalResponse = await client.chat.completions.create({
            model: modelId,
            messages,
            temperature: 0.7,
            max_tokens: 4096,
          });
          
          const finalContent = finalResponse.choices[0]?.message?.content || '';
          
          return {
            isBusinessQuery: false,
            isRealTimeData: true,
            thinking_process: `检测到 XML 工具调用，执行 ${functionName}`,
            query,
            summary: finalContent,
            strategicAdvice: '',
            trendData: [],
            topProducts: [],
            relatedKeywords: [],
            agentProtocolLogs: logs
          };
        }
      }
      
      logs.push({ step: 3, from: 'DeepSeek', to: 'AI 总管', action: 'RESPONSE', content: '直接回答（无需搜索）' });

      // 尝试解析 JSON
      try {
        const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          // 确保数组字段是数组类型
          return {
            ...result,
            trendData: Array.isArray(result.trendData) ? result.trendData : [],
            topProducts: Array.isArray(result.topProducts) ? result.topProducts : [],
            relatedKeywords: Array.isArray(result.relatedKeywords) ? result.relatedKeywords : [],
            agentProtocolLogs: logs
          };
        }
      } catch (e) {
        // JSON 解析失败
      }

      return {
        isBusinessQuery: false,
        isRealTimeData: false,
        thinking_process: '普通对话回复',
        query,
        summary: content,
        strategicAdvice: '',
        trendData: [],
        topProducts: [],
        relatedKeywords: [],
        agentProtocolLogs: logs
      };

    } catch (error: any) {
      this.logger.error(`smartChat 错误: ${error.message}`);
      
      // 如果是 429 限流错误，返回友好错误信息（固定使用 DeepSeek V3.1 Nex N1，不切换其他模型）
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        this.logger.warn('⚠️ DeepSeek V3.1 Nex N1 (free) 配额已用完');
        logs.push({ step: logs.length + 1, from: 'AI 总管', to: '系统', action: 'ERROR', content: 'DeepSeek V3.1 Nex N1 配额已用完' });
        
        return {
          isBusinessQuery: false,
          isRealTimeData: false,
          thinking_process: 'API 配额已用完',
          query,
          summary: '⚠️ **AI 服务暂时不可用**\n\nDeepSeek V3.1 Nex N1 (free) 免费配额已用完。\n\n**解决方案**：\n1. 等待配额重置（通常每天 UTC 00:00 重置）\n2. 在 OpenRouter 账户中添加余额',
          strategicAdvice: '',
          trendData: [],
          topProducts: [],
          relatedKeywords: [],
          agentProtocolLogs: logs
        };
      }
      
      // 其他错误，降级到普通 chat
      return this.chat(query, history, undefined, modelKey);
    }
  }

  /**
   * 分析产品市场潜力
   */
  async analyzeProduct(query: string, context?: any) {
    return this.chat(query, []);
  }

  /**
   * 翻译产品标题为中文搜索词
   */
  async translateToSearchTerms(englishTitle: string): Promise<string[]> {
    // TODO: 调用 Gemini 进行智能翻译
    // Mock 实现
    const keywords = englishTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter(w => w.length > 2);

    return keywords;
  }

  /**
   * 生成产品描述
   */
  async generateProductDescription(productInfo: {
    title: string;
    category: string;
    features?: string[];
  }): Promise<string> {
    // TODO: 调用 Gemini 生成描述
    return `${productInfo.title} - 优质${productInfo.category}产品`;
  }

  /**
   * 网络搜索 - 使用 AI 进行网络资料搜索和总结
   */
  async webSearch(query: string, options?: { maxResults?: number; language?: string }) {
    const maxResults = options?.maxResults || 5;
    const language = options?.language || 'zh';
    
    this.logger.log(`执行网络搜索: "${query}"`);
    
    // 构建搜索提示
    const searchPrompt = `
你是一个专业的信息检索和分析助手。请针对以下查询提供详细的信息和分析：

查询: ${query}

请提供:
1. 相关背景信息和最新动态
2. 关键数据和统计
3. 专业分析和见解
4. 相关资源和参考链接（如果有）

注意：
- 使用${language === 'zh' ? '中文' : '英文'}回复
- 提供准确、有价值的信息
- 如果涉及时效性信息，请说明可能的更新情况

返回 JSON 格式:
{
  "query": "原始查询",
  "summary": "搜索结果摘要",
  "keyFindings": ["关键发现1", "关键发现2"],
  "details": "详细分析内容",
  "sources": [{"title": "来源标题", "url": "链接", "snippet": "摘要"}],
  "relatedQueries": ["相关搜索1", "相关搜索2"],
  "timestamp": "${new Date().toISOString()}"
}
`;

    try {
      // 优先使用 OpenRouter
      if (this.openRouter) {
        const completion = await this.openRouter.chat.completions.create({
          model: this.FIXED_MODEL_ID,
          messages: [
            { role: 'system', content: '你是一个专业的信息检索助手，擅长搜索和整合网络资料。' },
            { role: 'user', content: searchPrompt }
          ],
          temperature: 0.3,
          max_tokens: 4096,
        });

        const content = completion.choices[0]?.message?.content || '';
        try {
          const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch {
          // 解析失败返回原始格式
        }
        
        return {
          query,
          summary: content.substring(0, 500),
          keyFindings: [],
          details: content,
          sources: [],
          relatedQueries: [],
          timestamp: new Date().toISOString()
        };
      }
      
      // 降级到 DeepSeek
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个专业的信息检索助手，擅长搜索和整合网络资料。' },
            { role: 'user', content: searchPrompt }
          ],
          temperature: 0.3,
          max_tokens: 4096,
        });

        const content = completion.choices[0]?.message?.content || '';
        try {
          const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch {
          // 解析失败返回原始格式
        }
        
        return {
          query,
          summary: content.substring(0, 500),
          keyFindings: [],
          details: content,
          sources: [],
          relatedQueries: [],
          timestamp: new Date().toISOString()
        };
      }
      
      throw new Error('没有可用的 AI 服务');
    } catch (error: any) {
      this.logger.error(`网络搜索失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 通用对话 - 简单的聊天对话，无需结构化输出
   */
  async simpleChat(message: string, history: { role: string; content: string }[] = []) {
    this.logger.log(`简单对话: "${message.substring(0, 50)}..."`);
    
    const systemPrompt = `
你是 TradeNexus AI 的智能助手「AI总管」，具备以下能力：
1. 外贸市场分析和产品调研
2. 网络资料搜索和信息整合
3. 商业问题解答和建议
4. 数据分析和趋势预测

请用专业、友好的方式回答用户问题。如果不确定，请如实说明。
`;

    try {
      // 优先使用 OpenRouter
      if (this.openRouter) {
        const completion = await this.openRouter.chat.completions.create({
          model: this.FIXED_MODEL_ID,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.map(h => ({ role: h.role as any, content: h.content })),
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 2048,
        });

        return {
          response: completion.choices[0]?.message?.content || '',
          provider: 'openrouter'
        };
      }
      
      // 降级到 DeepSeek
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.map(h => ({ role: h.role as any, content: h.content })),
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 2048,
        });

        return {
          response: completion.choices[0]?.message?.content || '',
          provider: 'deepseek'
        };
      }
      
      throw new Error('没有可用的 AI 服务');
    } catch (error: any) {
      this.logger.error(`简单对话失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取 AI 服务状态
   */
  getServiceStatus() {
    return {
      activeProvider: this.activeProvider,
      providers: {
        openrouter: {
          available: !!this.openRouterKey,
          model: this.FIXED_MODEL_ID
        },
        gemini: {
          available: !!this.geminiKey,
          model: 'gemini-2.0-flash'
        },
        deepseek: {
          available: !!this.deepseekKey,
          model: 'deepseek-chat'
        }
      }
    };
  }

  /**
   * 一键式工作流: 爆款复刻
   */
  async runReplicationWorkflow(amazonUrl: string, userId: string) {
    // 1. 解析 Amazon 链接获取产品信息
    // 2. 调用市场情报官分析竞品
    // 3. 调用供应链总监搜索 1688 货源
    // 4. 调用贸易合规官检查认证
    // 5. 计算利润并生成报告

    return {
      status: 'workflow_started',
      message: '爆款复刻工作流已启动',
      steps: [
        { name: '解析产品信息', status: 'pending' },
        { name: '市场分析', status: 'pending' },
        { name: '货源搜索', status: 'pending' },
        { name: '合规检查', status: 'pending' },
        { name: '利润计算', status: 'pending' },
      ],
    };
  }

  // ============================================
  // Titans 记忆系统辅助方法
  // ============================================

  /**
   * 从查询中提取产品类型
   */
  private extractProductType(query: string): string | undefined {
    const productPatterns = [
      /(?:电池|battery|batteries)/i,
      /(?:LED|灯|light|lighting)/i,
      /(?:电子产品|electronics|electronic)/i,
      /(?:服装|clothing|apparel|fashion)/i,
      /(?:玩具|toys|toy)/i,
      /(?:家具|furniture)/i,
      /(?:化妆品|cosmetics|beauty)/i,
      /(?:食品|food|snacks)/i,
    ];
    
    for (const pattern of productPatterns) {
      const match = query.match(pattern);
      if (match) return match[0];
    }
    return undefined;
  }

  /**
   * 从查询中提取物流路线
   */
  private extractRoute(query: string): string | undefined {
    const routePatterns = [
      /(?:到|去|发往|运往|shipping to|to)\s*(德国|Germany|DE)/i,
      /(?:到|去|发往|运往|shipping to|to)\s*(美国|USA|US|America)/i,
      /(?:到|去|发往|运往|shipping to|to)\s*(英国|UK|Britain)/i,
      /(?:到|去|发往|运往|shipping to|to)\s*(日本|Japan|JP)/i,
      /(?:到|去|发往|运往|shipping to|to)\s*(欧洲|Europe|EU)/i,
      /(?:到|去|发往|运往|shipping to|to)\s*(东南亚|SEA|Southeast Asia)/i,
    ];
    
    const countryMap: Record<string, string> = {
      '德国': 'CN-DE', 'Germany': 'CN-DE', 'DE': 'CN-DE',
      '美国': 'CN-US', 'USA': 'CN-US', 'US': 'CN-US', 'America': 'CN-US',
      '英国': 'CN-UK', 'UK': 'CN-UK', 'Britain': 'CN-UK',
      '日本': 'CN-JP', 'Japan': 'CN-JP', 'JP': 'CN-JP',
      '欧洲': 'CN-EU', 'Europe': 'CN-EU', 'EU': 'CN-EU',
      '东南亚': 'CN-SEA', 'SEA': 'CN-SEA', 'Southeast Asia': 'CN-SEA',
    };
    
    for (const pattern of routePatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return countryMap[match[1]] || `CN-${match[1].toUpperCase()}`;
      }
    }
    return undefined;
  }

  /**
   * 检测知识类别（用于自动保存搜索结果）
   */
  private detectKnowledgeCategory(query: string): string {
    const categoryPatterns: [RegExp, string][] = [
      [/法规|规定|政策|认证|标准|合规|FDA|CE|CPC|EPR/i, 'regulation'],
      [/货代|物流|运费|运输|海运|空运|快递/i, 'logistics'],
      [/供应商|工厂|采购|1688|阿里巴巴/i, 'supplier'],
      [/关税|HS|编码|税率|退税/i, 'tariff'],
      [/市场|趋势|销量|竞品|分析/i, 'market'],
    ];
    
    for (const [pattern, category] of categoryPatterns) {
      if (pattern.test(query)) return category;
    }
    return 'general';
  }

  /**
   * 从查询中提取国家/地区
   */
  private extractCountry(query: string): string | undefined {
    const countryPatterns: [RegExp, string][] = [
      [/德国|Germany|german/i, 'DE'],
      [/美国|USA|US|America|american/i, 'US'],
      [/英国|UK|Britain|british/i, 'UK'],
      [/日本|Japan|japanese/i, 'JP'],
      [/欧洲|Europe|european|EU/i, 'EU'],
      [/中国|China|chinese|CN/i, 'CN'],
      [/法国|France|french/i, 'FR'],
      [/意大利|Italy|italian/i, 'IT'],
      [/西班牙|Spain|spanish/i, 'ES'],
      [/澳大利亚|Australia|australian/i, 'AU'],
    ];
    
    for (const [pattern, code] of countryPatterns) {
      if (pattern.test(query)) return code;
    }
    return undefined;
  }

  // ============================================
  // 3.5.11: 自动记忆提取 - 对话结束自动总结
  // ============================================

  /**
   * 自动提取对话摘要并保存到长期记忆
   * 在对话结束或达到一定轮数时调用
   */
  async extractAndSaveMemory(
    userId: string,
    sessionId: string,
    history: { role: string; content: string }[]
  ): Promise<{ saved: boolean; summary?: string; keyEntities?: Record<string, any> }> {
    if (!this.memoryService || history.length < 2) {
      return { saved: false };
    }

    try {
      // 构建对话内容
      const conversationText = history
        .map(h => `${h.role === 'user' ? '用户' : 'AI'}: ${h.content}`)
        .join('\n');

      // 使用 AI 提取摘要和关键实体
      const extractionPrompt = `分析以下外贸相关对话，提取关键信息：

${conversationText}

请返回 JSON 格式：
{
  "summary": "一句话概括对话主题和结论",
  "keyEntities": {
    "products": ["涉及的产品"],
    "countries": ["涉及的国家/地区"],
    "regulations": ["涉及的法规/认证"],
    "prices": ["涉及的价格/报价"],
    "suppliers": ["涉及的供应商"]
  },
  "userIntent": "用户的核心意图",
  "actionItems": ["后续行动建议"],
  "sentiment": "positive/neutral/negative",
  "importance": 1-10
}`;

      const client = this.openRouter || this.openai;
      if (!client) return { saved: false };

      const response = await client.chat.completions.create({
        model: this.FIXED_MODEL_ID,
        messages: [{ role: 'user', content: extractionPrompt }],
        temperature: 0.3,
        max_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) return { saved: false };

      const extracted = JSON.parse(jsonMatch[0]);

      // 保存到对话记忆
      await this.memoryService.saveConversationMemory({
        userId,
        sessionId,
        summary: extracted.summary || '对话摘要',
        keyEntities: extracted.keyEntities || {},
        userPreferences: { intent: extracted.userIntent },
        actionItems: extracted.actionItems || [],
        sentiment: extracted.sentiment || 'neutral',
        importance: extracted.importance || 5,
      });

      this.logger.log(`🧠 对话记忆已保存: ${extracted.summary?.substring(0, 50)}...`);

      // 如果有价格信息，自动保存为报价记忆
      if (extracted.keyEntities?.prices?.length > 0) {
        for (const price of extracted.keyEntities.prices) {
          try {
            const route = extracted.keyEntities.countries?.length >= 2
              ? `${extracted.keyEntities.countries[0]}-${extracted.keyEntities.countries[1]}`
              : 'CN-US';
            await this.memoryService.saveQuote({
              itemType: 'product',
              itemName: extracted.keyEntities.products?.[0] || '通用产品',
              route,
              price: parseFloat(price.replace(/[^0-9.]/g, '')) || 0,
              currency: price.includes('$') ? 'USD' : price.includes('€') ? 'EUR' : 'CNY',
              unit: 'kg',
              source: 'conversation',
              validityDays: 30,
            });
          } catch (e) {
            // 忽略保存失败
          }
        }
      }

      return {
        saved: true,
        summary: extracted.summary,
        keyEntities: extracted.keyEntities,
      };
    } catch (error: any) {
      this.logger.warn(`记忆提取失败: ${error.message}`);
      return { saved: false };
    }
  }

  /**
   * 智能判断是否应该保存对话记忆
   */
  shouldSaveMemory(history: { role: string; content: string }[]): boolean {
    // 至少 4 轮对话才考虑保存
    if (history.length < 4) return false;
    
    // 检查是否有外贸相关内容
    const fullText = history.map(h => h.content).join(' ');
    const tradeKeywords = /报价|价格|运费|货代|供应商|认证|HS|关税|出口|进口|FBA|亚马逊|1688/i;
    
    return tradeKeywords.test(fullText);
  }
}
