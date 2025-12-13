/**
 * Titans Memory Agent - Function Calling 工具定义
 * 用于让 AI 自主决定何时保存/更新长期记忆
 */

export const MEMORY_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'save_quote',
      description: '保存报价信息到长期记忆。当对话中提到具体的价格、运费、报价时调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          item_type: { 
            type: 'string', 
            enum: ['product', 'freight', 'service'],
            description: '报价类型：product=产品报价, freight=运费报价, service=服务报价'
          },
          item_name: { 
            type: 'string',
            description: '产品/服务名称'
          },
          price: { 
            type: 'number',
            description: '价格数值'
          },
          currency: { 
            type: 'string', 
            default: 'USD',
            description: '货币代码，如 USD, CNY, EUR'
          },
          supplier: { 
            type: 'string',
            description: '供应商名称'
          },
          validity_days: { 
            type: 'integer', 
            default: 30,
            description: '报价有效天数'
          },
          terms: { 
            type: 'string',
            description: '贸易条款，如 FOB, CIF, EXW'
          },
          route: { 
            type: 'string',
            description: '物流路线，如 CN-DE (中国到德国)'
          }
        },
        required: ['item_type', 'item_name', 'price']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_regulation',
      description: '保存法规/政策信息到知识库。当搜索到新的法规、关税政策、认证要求时调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          country: { 
            type: 'string',
            description: '适用国家/地区代码，如 US, DE, EU, CN'
          },
          category: { 
            type: 'string', 
            enum: ['regulation', 'tariff', 'certification', 'restriction', 'labeling'],
            description: '法规类型'
          },
          title: { 
            type: 'string',
            description: '法规标题'
          },
          content: { 
            type: 'string',
            description: '法规内容摘要'
          },
          effective_year: { 
            type: 'string',
            description: '生效年份'
          },
          source: {
            type: 'string',
            description: '信息来源URL'
          }
        },
        required: ['country', 'category', 'title', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_relation',
      description: '保存实体关系到知识图谱。当发现供应商能力、产品认证要求、货代服务范围等关系时调用。',
      parameters: {
        type: 'object',
        properties: {
          from_entity: { 
            type: 'string',
            description: '起始实体名称'
          },
          from_type: { 
            type: 'string', 
            enum: ['supplier', 'product', 'country', 'forwarder', 'certification', 'hs_code'],
            description: '起始实体类型'
          },
          relation: { 
            type: 'string', 
            enum: ['produces', 'requires', 'serves', 'has_certification', 'restricts', 'applies_to'],
            description: '关系类型'
          },
          to_entity: { 
            type: 'string',
            description: '目标实体名称'
          },
          to_type: { 
            type: 'string',
            enum: ['supplier', 'product', 'country', 'forwarder', 'certification', 'hs_code'],
            description: '目标实体类型'
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: '置信度 (0-1)'
          }
        },
        required: ['from_entity', 'from_type', 'relation', 'to_entity', 'to_type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'summarize_conversation',
      description: '总结当前对话并存入长期记忆。在对话结束或用户表达重要偏好时调用。',
      parameters: {
        type: 'object',
        properties: {
          summary: { 
            type: 'string',
            description: '对话摘要，简洁描述用户关注点和讨论内容'
          },
          key_entities: { 
            type: 'object',
            description: '关键实体，如 {"focus_country": "DE", "focus_product": "LED灯"}',
            properties: {
              focus_country: { type: 'string' },
              focus_product: { type: 'string' },
              focus_supplier: { type: 'string' }
            }
          },
          user_preferences: {
            type: 'object',
            description: '用户偏好，如 {"prefers_sea_freight": true, "budget_sensitive": true}'
          },
          importance: { 
            type: 'integer', 
            minimum: 1, 
            maximum: 10,
            description: '重要性评分 (1-10)'
          },
          action_items: {
            type: 'array',
            items: { type: 'string' },
            description: '待办事项列表'
          }
        },
        required: ['summary', 'key_entities']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_memory',
      description: '查询长期记忆。在回答问题前，先检索相关的历史信息。',
      parameters: {
        type: 'object',
        properties: {
          query_type: {
            type: 'string',
            enum: ['quote', 'knowledge', 'relation', 'hybrid'],
            description: '查询类型'
          },
          keywords: {
            type: 'string',
            description: '搜索关键词'
          },
          filters: {
            type: 'object',
            description: '过滤条件',
            properties: {
              country: { type: 'string' },
              category: { type: 'string' },
              route: { type: 'string' },
              item_type: { type: 'string' }
            }
          }
        },
        required: ['query_type', 'keywords']
      }
    }
  }
];

/**
 * Memory Agent 系统提示
 */
export const MEMORY_AGENT_SYSTEM_PROMPT = `你是一个具有长期记忆能力的外贸智能助手。

【记忆能力】:
你可以通过以下工具管理长期记忆：
1. save_quote - 保存报价信息（价格、运费等有时效性的数据）
2. save_regulation - 保存法规知识（关税政策、认证要求等）
3. save_relation - 保存实体关系（供应商能力、产品要求等）
4. summarize_conversation - 总结对话要点
5. query_memory - 查询历史记忆

【记忆原则】:
- 发现新的报价信息时，主动保存（注意设置合理的有效期）
- 搜索到法规更新时，保存到知识库
- 发现实体间的重要关系时，保存到图谱
- 对话结束前，总结用户的关注点和偏好

【回答原则】:
- 回答问题前，先查询相关的历史记忆
- 如果记忆中有相关信息，优先使用并标注"[记忆]"
- 如果信息可能过期，提醒用户确认
- 将新获取的有价值信息存入记忆`;
