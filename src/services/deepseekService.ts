/**
 * AI 服务
 * 通过后端代理调用 OpenRouter/DeepSeek/Gemini 模型（避免浏览器 CORS 限制）
 * 支持自动降级：OpenRouter > Gemini > DeepSeek
 */

import { AnalysisResult, Message } from "../types";
import { toolsMap } from "./toolService";

// 后端 API 地址
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// AI Provider 类型 (优先级: openrouter > gemini > deepseek)
type AIProvider = 'openrouter' | 'gemini' | 'deepseek';

// 工具执行辅助函数
const executeTools = async (toolName: string, args: any) => {
  try {
    console.log(`[executeTools] 执行工具: ${toolName}, 参数:`, args);
    const fn = toolsMap[toolName as keyof typeof toolsMap];
    if (!fn) {
      console.warn(`[executeTools] 未找到工具: ${toolName}`);
      return null;
    }

    let result;
    if (toolName === 'fetchProductDetails') {
      result = await fn(args.query || '', args.platform || 'Amazon');
    } else if (toolName === 'fetchCompetitors') {
      result = await fn(args.productName || '');
    } else if (toolName === 'fetchProductReviews') {
      result = await fn(args.productId || '');
    }

    console.log(`[executeTools] 工具 ${toolName} 返回结果数量:`, Array.isArray(result) ? result.length : 1);
    return { name: toolName, result };
  } catch (toolError) {
    console.error(`[executeTools] 工具 ${toolName} 执行失败:`, toolError);
    return null;
  }
};

/**
 * 通过后端代理调用 AI 生成趋势分析
 * @param _apiKey 已弃用，保留兼容性
 * @param query 用户查询
 * @param history 对话历史
 * @param modelKey 可选的模型键名 (deepseek-v3.1, gemini-2.0-flash, deepseek-chat)
 * @param webSearchMode 联网搜索模式 ('auto' | 'on' | 'off')
 */
export const generateTrendAnalysis = async (
  _apiKey: string,
  query: string,
  history: Message[] = [],
  modelKey?: string,
  webSearchMode: 'auto' | 'on' | 'off' = 'auto'
): Promise<AnalysisResult> => {
  console.log("🚀 开始 AI 分析...");

  // 阶段 1: 工具执行（获取真实产品数据）
  let toolResults: any[] = [];
  try {
    console.log("🔧 启动工具执行阶段...");

    // 判断是否需要调用工具
    const needsProductSearch = /产品|商品|爆款|热销|趋势|市场|选品|product|trend|market/i.test(query);
    
    if (needsProductSearch) {
      // 提取搜索关键词
      const keywordMatch = query.match(/(?:分析|查询|搜索|找|看看|了解)\s*(.+?)(?:的|市场|趋势|产品|$)/);
      const searchKeyword = keywordMatch ? keywordMatch[1] : query.replace(/[，。？！]/g, ' ').split(' ')[0];
      
      console.log("🔍 自动执行产品搜索，关键词:", searchKeyword);
      const result = await executeTools('fetchProductDetails', { query: searchKeyword, platform: 'Amazon' });
      
      if (result && result.result) {
        toolResults.push(result);
        console.log("✅ 工具执行完成。");
      }
    }
  } catch (e) {
    console.warn("⚠️ 工具执行阶段失败:", e);
  }

  // 阶段 2: 通过后端代理调用 AI（支持模型选择）
  const callAI = async (provider: AIProvider, model?: string): Promise<AnalysisResult> => {
    console.log(`📤 调用后端 AI 服务 (${provider}, model: ${model || 'default'})...`);

    // 构建请求，将工具结果附加到查询中
    let enrichedQuery = query;
    if (toolResults.length > 0) {
      enrichedQuery = `${query}\n\n[已获取的实时市场数据]:\n${JSON.stringify(toolResults, null, 2)}`;
    }

    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: enrichedQuery,
        history: history.map(h => ({ role: h.role, content: h.content })),
        provider,
        model,
        webSearchMode
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json() as AnalysisResult;
  };

  try {
    // 使用指定模型或默认使用 DeepSeek V3.1
    let result: AnalysisResult;
    const selectedModelKey = modelKey || 'deepseek-v3.1';
    
    try {
      result = await callAI('openrouter', selectedModelKey);
      console.log(`✅ AI 分析完成 (模型: ${selectedModelKey})`);
    } catch (primaryError: any) {
      console.warn(`⚠️ 主模型 ${selectedModelKey} 调用失败，尝试备用:`, primaryError.message);
      try {
        result = await callAI('openrouter', 'gemini-2.0-flash');
        console.log("✅ 备用模型 Gemini 2.0 Flash 分析完成");
      } catch (fallbackError: any) {
        console.warn("⚠️ 备用模型调用失败，尝试 DeepSeek:", fallbackError.message);
        result = await callAI('deepseek');
        console.log("✅ DeepSeek 原生 API 分析完成");
      }
    }

    console.log("✅ AI 分析完成，产品数:", Array.isArray(result.topProducts) ? result.topProducts.length : 0);

    // 后处理：确保数组字段是数组类型（防止后端返回空对象）
    result.trendData = Array.isArray(result.trendData) ? result.trendData : [];
    result.topProducts = Array.isArray(result.topProducts) ? result.topProducts : [];
    result.relatedKeywords = Array.isArray(result.relatedKeywords) ? result.relatedKeywords : [];
    result.agentProtocolLogs = Array.isArray(result.agentProtocolLogs) ? result.agentProtocolLogs : [];

    // 后处理：如果有真实数据，强制设置 dataSource
    if (toolResults.length > 0 && result.topProducts.length > 0) {
      result.topProducts = result.topProducts.map(p => ({
        ...p,
        dataSource: 'real' as const
      }));
    }

    return result;
  } catch (error: any) {
    console.error("❌ AI 分析失败:", error);
    throw error;
  }
};

/**
 * 网络资料搜索
 */
export const webSearch = async (
  query: string,
  options?: { maxResults?: number; language?: string }
): Promise<{
  query: string;
  summary: string;
  keyFindings: string[];
  details: string;
  sources: { title: string; url: string; snippet: string }[];
  relatedQueries: string[];
  timestamp: string;
}> => {
  console.log("🔍 开始网络搜索:", query);

  const response = await fetch(`${API_BASE}/ai/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      maxResults: options?.maxResults || 5,
      language: options?.language || 'zh'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log("✅ 网络搜索完成");
  return result;
};

/**
 * 简单对话 - 无结构化输出
 */
export const simpleChat = async (
  message: string,
  history: { role: string; content: string }[] = []
): Promise<{ response: string; provider: string }> => {
  console.log("💬 简单对话:", message.substring(0, 50));

  const response = await fetch(`${API_BASE}/ai/simple-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log("✅ 对话完成");
  return result;
};

/**
 * 获取 AI 服务状态
 */
export const getAIServiceStatus = async (): Promise<{
  activeProvider: string;
  providers: {
    openrouter: { available: boolean; model: string };
    gemini: { available: boolean; model: string };
    deepseek: { available: boolean; model: string };
  };
}> => {
  const response = await fetch(`${API_BASE}/ai/status`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
};

export default { generateTrendAnalysis, webSearch, simpleChat, getAIServiceStatus };
