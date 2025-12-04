
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Message, AgentType } from "../types";

// Schema 更新：包含思考过程 (Thinking Process) 和 代理通信协议 (Protocol Logs)
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    thinking_process: { type: Type.STRING, description: "Detailed chain of thought reasoning, explaining how you decided to delegate tasks." },
    agentProtocolLogs: {
      type: Type.ARRAY,
      description: "A chronological list of formal communication between agents.",
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.INTEGER },
          from: { type: Type.STRING, enum: Object.values(AgentType) },
          to: { type: Type.STRING, enum: Object.values(AgentType) },
          action: { type: Type.STRING, enum: ['REQUEST', 'RESPONSE', 'BROADCAST'] },
          content: { type: Type.STRING, description: "Structured data (JSON) or specific query content" }
        },
        required: ["step", "from", "to", "action", "content"]
      }
    },
    query: { type: Type.STRING, description: "The strategic intent or query analyzed" },
    summary: { type: Type.STRING, description: "Direct response or summary to the user." },
    strategicAdvice: { type: Type.STRING, description: "Actionable strategic recommendations." },
    trendData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "Date in YYYY-MM-DD" },
          volume: { type: Type.NUMBER, description: "Index 0-100" }
        }
      },
      description: "7-day trend history."
    },
    topProducts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          source: { type: Type.STRING, enum: ['全球数据库', '竞争对手', '海关数据'] },
          trendScore: { type: Type.NUMBER, description: "0-100 score" },
          profitMargin: { type: Type.STRING },
          complianceNote: { type: Type.STRING, description: "HS Code or Risk Alert (e.g., 'HS 9503.00')" },
          description: { type: Type.STRING },
          imageUrl: { type: Type.STRING, description: "Placeholder image URL" },
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

// 格式化历史消息
const formatHistory = (history: Message[]): string => {
  if (!history || history.length === 0) return "";
  return history.map(msg => 
    `${msg.role === 'user' ? '用户' : 'AI总管'}: ${msg.content}`
  ).join('\n');
};

export const generateTrendAnalysis = async (apiKey: string, query: string, history: Message[] = []): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const historyContext = formatHistory(history);

  const systemPrompt = `
    你是由“外贸AI军团”架构驱动的【AI总管 (General Manager)】。
    
    【你的团队 (Agent Matrix)】:
    1. ${AgentType.MARKET_INTEL} (Market): 负责趋势、数据、选品。
    2. ${AgentType.LEAD_NURTURING} (Leads): 负责邮件、CRM、Lead。
    3. ${AgentType.COMPLIANCE} (Compliance): 负责法律、税务、HS编码、制裁名单。
    4. ${AgentType.SUPPLY_CHAIN} (Supply): 负责物流、供应商、库存、利润核算。

    【高级通信协议 (A2A Protocol)】:
    必须模拟真实且复杂的 Agent 间数据交换。
    
    规则 1 (Request): 请求必须明确目标数据。
    规则 2 (Response): 响应必须包含 **结构化 JSON 数据**，而不仅仅是文本。
    
    示例流程：
    1. 总管 -> 市场情报官: REQUEST "分析 '户外露营灯' 的市场趋势"
    2. 市场情报官 -> 总管: RESPONSE "{\"trend_index\": 85, \"top_competitors\": [\"Anker\", \"GoalZero\"]}"
    3. 总管 -> 贸易合规官: REQUEST "查询 '带锂电池露营灯' 出口德国的合规要求"
    4. 贸易合规官 -> 总管: RESPONSE "{\"hs_code\": \"8513.10\", \"certifications\": [\"CE\", \"RoHS\", \"WEEE\"], \"risk_level\": \"MEDIUM\"}"

    【语言要求】: 
    - 思考过程和对外回复使用简体中文。
    - agentProtocolLogs 中的 content 如果是 RESPONSE，**必须**是 JSON 字符串格式。如果是 REQUEST，可以是自然语言。

    上下文历史：
    ${historyContext}

    当前用户指令： "${query}"

    【输出要求】:
    - 严格遵循 JSON Schema。
    - agentProtocolLogs 至少包含 4-6 个交互步骤，展示深度协作。
    - 图片使用 "https://picsum.photos/400/300?random=X"。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
        temperature: 0.4, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Agentic Analysis Failed:", error);
    throw error;
  }
};
