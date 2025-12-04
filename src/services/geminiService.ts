
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
          imageUrl: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
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

// 工具执行辅助函数
const executeTools = async (functionCalls: any[]) => {
  const results = [];
  for (const call of functionCalls) {
    const fn = toolsMap[call.name as keyof typeof toolsMap];
    if (fn) {
      const args = call.args;
      // 根据不同工具签名调用
      let result;
      if (call.name === 'fetchProductDetails') {
        result = await fn(args.query, args.platform);
      } else if (call.name === 'fetchCompetitors') {
        result = await fn(args.productName);
      } else if (call.name === 'fetchProductReviews') {
        result = await fn(args.productId);
      }

      results.push({
        name: call.name,
        result: result
      });
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

    // 构建鼓励使用工具的提示词
    const toolSystemPrompt = `
      你是"市场情报官 (Market Intelligence Officer)"。
      你的目标是收集实时数据以回答用户的请求："${query}"
      
      可用工具：
      - fetchProductDetails: 获取 Amazon、TikTok 等平台的产品价格、销量和图片
      - fetchCompetitors: 查找特定产品的竞品
      
      指令：
      1. 分析请求。如果需要具体的产品数据，调用 'fetchProductDetails' 工具。
      2. 如有需要，可以为不同平台多次调用工具。
      3. 如果不需要外部数据，或在收到工具输出后，简单回复 "DATA_COLLECTION_COMPLETE"。
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

    【实时市场数据 (由 Market Intelligence Officer 提供)】:
    ${toolContext}

    当前指令： "${query}"

    【输出要求】:
    - 严格遵循 JSON Schema。
    - agentProtocolLogs 至少包含 4-6 个交互步骤。
    - 如果有了实时市场数据，请务必在 'topProducts' 和 'trendData' 中使用这些真实数据，而不是编造数据。
    - 图片使用数据中的 'main_image' 或 "https://picsum.photos/400/300?random=X"。
    - **深度分析**: 如果有 'sentiment' 或 'priceHistory' 数据，请在 'description' 或 'strategicAdvice' 中体现。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      }
    });

    const text = response.text;
    if (!text) throw new Error("无法从 Gemini 获取响应");
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Agentic 分析失败:", error);
    throw error;
  }
};
