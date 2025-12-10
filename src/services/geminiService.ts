
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Message, AgentType } from "../types";
import { marketIntelligenceTools, toolsMap } from "./toolService";

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    thinking_process: { type: Type.STRING, description: "详细的思维链推理过程（中文）" },
    agentProtocolLogs: {
      type: Type.ARRAY,
      description: "按时序排列的 Agent 间正式通信日志",
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.INTEGER },
          from: { type: Type.STRING, enum: Object.values(AgentType) },
          to: { type: Type.STRING, enum: Object.values(AgentType) },
          action: { type: Type.STRING, enum: ['REQUEST', 'RESPONSE', 'BROADCAST'] },
          content: { type: Type.STRING, description: "结构化数据 (JSON) 或具体查询内容" }
        },
        required: ["step", "from", "to", "action", "content"]
      }
    },
    query: { type: Type.STRING },
    summary: { type: Type.STRING },
    strategicAdvice: { type: Type.STRING },
    trendData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          volume: { type: Type.NUMBER }
        }
      }
    },
    topProducts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          source: { type: Type.STRING, enum: ['全球数据库', '竞争对手', '海关数据'] },
          trendScore: { type: Type.NUMBER },
          profitMargin: { type: Type.STRING },
          complianceNote: { type: Type.STRING },
          description: { type: Type.STRING },
          imageUrl: { type: Type.STRING, description: '产品主图URL（必须使用真实数据中的 main_image）' },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          // 数据来源
          dataSource: { type: Type.STRING, enum: ['real', 'mock'], description: '数据来源：real=真实API, mock=模拟数据' },
          // 产品链接（重要！）
          productUrl: { type: Type.STRING, description: '产品详情页链接（如 https://www.amazon.com/dp/ASIN）' },
          asin: { type: Type.STRING, description: 'Amazon ASIN 编码' },
          price: { type: Type.STRING, description: '产品价格（如 $89.99）' },
          salesVolume: { type: Type.STRING, description: '销量标签（如 5K+ bought in past month）' },
          // 备用字段
          amazonSearchUrl: { type: Type.STRING, description: '亚马逊搜索链接（备用）' },
          searchKeyword: { type: Type.STRING, description: '搜索关键词' }
        }
      }
    },
    relatedKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ["thinking_process", "agentProtocolLogs", "query", "summary", "strategicAdvice", "trendData", "topProducts", "relatedKeywords"]
};

const formatHistory = (history: Message[]): string => {
  if (!history || history.length === 0) return "";
  return history.map(msg =>
    `${msg.role === 'user' ? '用户' : 'AI总管'}: ${msg.content}`
  ).join('\n');
};

// 工具执行辅助函数 - 增强错误处理
const executeTools = async (functionCalls: any[]) => {
  const results = [];
  for (const call of functionCalls) {
    try {
      console.log(`[executeTools] 执行工具: ${call.name}, 参数:`, call.args);
      const fn = toolsMap[call.name as keyof typeof toolsMap];
      if (!fn) {
        console.warn(`[executeTools] 未找到工具: ${call.name}`);
        continue;
      }

      const args = call.args || {};
      let result;

      if (call.name === 'fetchProductDetails') {
        // 调用产品详情工具，默认使用 Amazon 平台
        result = await fn(args.query || '', args.platform || 'Amazon');
      } else if (call.name === 'fetchCompetitors') {
        result = await fn(args.productName || '');
      } else if (call.name === 'fetchProductReviews') {
        result = await fn(args.productId || '');
      }

      console.log(`[executeTools] 工具 ${call.name} 返回结果数量:`, Array.isArray(result) ? result.length : 1);
      results.push({
        name: call.name,
        result: result
      });
    } catch (toolError) {
      console.error(`[executeTools] 工具 ${call.name} 执行失败:`, toolError);
      // 继续执行其他工具，不中断整个流程
    }
  }
  return results;
};

export const generateTrendAnalysis = async (apiKey: string, query: string, history: Message[] = []): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey });
  const historyContext = formatHistory(history);

  // 阶段 1: 工具执行循环
  // 使用单独的配置避免 JSON Schema 约束干扰工具调用
  let toolContext = "";
  try {
    console.log("🔧 启动工具执行阶段...");

    // 构建强力鼓励使用工具的提示词
    const toolSystemPrompt = `
      你是\"市场情报官 (Market Intelligence Officer)\"，核心职责是通过真实 API 获取市场数据。
      
      用户请求：\"${query}\"
      
      【可用工具】:
      - fetchProductDetails(query, platform): 搜索 Amazon/TikTok 等平台的产品，返回销量、价格、BSR排名
        - query: 搜索关键词（如"wireless earbuds", "宠物用品"）
        - platform: "Amazon" | "TikTok" | "Alibaba"
      - fetchCompetitors(productName): 查找竞品
      
      【重要指令】:
      1. 如果用户询问任何产品、市场趋势、爆款、热销产品，必须调用 fetchProductDetails 工具
      2. 平台默认选 "Amazon"，除非用户明确指定其他平台
      3. 工具会返回【真实排名】数据，包括 BSR 和销量标签
      4. 调用工具后，你会收到数据，然后回复 "DATA_COLLECTION_COMPLETE"
      
      【立即行动】:
      从用户请求中提取核心关键词，调用 fetchProductDetails 获取数据。
    `;

    // 第一轮：询问模型是否使用工具
    const toolResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: toolSystemPrompt }] }
      ],
      config: {
        tools: marketIntelligenceTools,
      }
    });

    // 处理函数调用
    // 注意：SDK 对函数调用的响应结构需要仔细处理
    const candidates = toolResponse.candidates;
    if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
      const parts = candidates[0].content.parts;
      const functionCalls = parts.filter((part: any) => part.functionCall);

      if (functionCalls.length > 0) {
        console.log("🎯 检测到工具调用:", functionCalls.length);
        const toolResults = await executeTools(functionCalls.map((fc: any) => fc.functionCall));

        // 将工具结果添加到上下文中用于最终 JSON 生成
        toolContext = `
          [实时市场数据已获取]:
          ${JSON.stringify(toolResults, null, 2)}
        `;
        console.log("✅ 工具执行完成。上下文已更新。");
      } else {
        console.log("ℹ️ 模型未使用工具。");
      }
    }
  } catch (e) {
    console.warn("⚠️ 工具执行阶段失败，继续回退流程:", e);
  }

  // 阶段 2: 最终 JSON 生成
  const systemPrompt = `
    你是由"外贸AI军团"架构驱动的【AI总管 (General Manager)】。
    
    【团队成员】:
    1. ${AgentType.MARKET_INTEL}: 负责趋势、数据、选品。
    2. ${AgentType.LEAD_NURTURING}: 负责邮件、CRM、Lead。
    3. ${AgentType.COMPLIANCE}: 负责法律、税务、HS编码。
    4. ${AgentType.SUPPLY_CHAIN}: 负责物流、供应商、库存。

    【通信协议】:
    模拟真实 Agent 间数据交换。
    规则 1 (Request): 请求明确。
    规则 2 (Response): 响应必须包含 **结构化 JSON 数据**。
    
    上下文历史：
    ${historyContext}

    【实时市场数据 (由 Market Intelligence Officer 通过 Apify Amazon Scraper 获取)】:
    ${toolContext}

    当前指令： "${query}"

    【输出要求】:
    - 严格遵循 JSON Schema。
    - agentProtocolLogs 至少包含 4-6 个交互步骤。
    - topProducts 只返回前 3 个最热销的产品（按销量/评论数排序）
    
    【重要 - 爆款排名与数据来源】:
    - 如果 toolContext 包含真实产品数据：
      1. 在 summary 中提及"已从 Amazon 获取真实数据"
      2. topProducts 必须使用真实数据中的前 3 个产品，按销量/评论数排名
      3. 每个产品的 dataSource 设置为 "real"
      4. 在 strategicAdvice 中分析热销原因和采购建议
    - 如果没有真实数据：
      1. 说明"使用模拟数据演示"
      2. 每个产品的 dataSource 设置为 "mock"
    
    【产品信息格式 - 极其重要！】:
    从 toolContext 中的真实数据提取以下字段：
    - id: 使用产品的 ASIN（如 "B0CF3VGQFL"）
    - name: 使用 title 字段
    - imageUrl: 【必须】使用 main_image 字段的真实图片URL（不要用 picsum.photos）
    - productUrl: 【必须】使用 url 或 link 字段（格式如 https://www.amazon.com/dp/ASIN）
    - asin: 产品的 ASIN 编码
    - price: 使用 price 字段（格式如 "$89.99"）
    - salesVolume: 使用 sales_volume 或 recentSalesLabel 字段
    - trendScore: 根据评论数推算 (reviewCount > 10000 = 95, > 5000 = 85, > 1000 = 75, 其他 = 65)
    - amazonSearchUrl: 备用，格式为 https://www.amazon.com/s?k=关键词
    - searchKeyword: 用户的搜索关键词（英文）
    
    【示例】:
    如果 toolContext 包含:
    { "title": "PETLIBRO Automatic Cat Feeder", "main_image": "https://m.media-amazon.com/...", "url": "https://www.amazon.com/dp/B0CF3VGQFL", "price": "$89.99", "sales_volume": "5K+ bought" }
    
    则 topProducts 应包含:
    { "id": "B0CF3VGQFL", "name": "PETLIBRO Automatic Cat Feeder", "imageUrl": "https://m.media-amazon.com/...", "productUrl": "https://www.amazon.com/dp/B0CF3VGQFL", "asin": "B0CF3VGQFL", "price": "$89.99", "salesVolume": "5K+ bought", ... }
  `;

  try {
    console.log("📤 阶段 2: 开始最终 JSON 生成...");
    console.log("📋 toolContext 长度:", toolContext.length);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      }
    });

    console.log("📥 阶段 2: 收到 Gemini 响应");
    const text = response.text;
    if (!text) throw new Error("无法从 Gemini 获取响应");
    console.log("✅ 阶段 2: JSON 解析成功");
    return JSON.parse(text) as AnalysisResult;
  } catch (error: any) {
    console.error("❌ Agentic 分析失败:", error);
    console.error("❌ 错误详情:", error?.message || error);
    console.error("❌ 错误堆栈:", error?.stack);
    throw error;
  }
};
