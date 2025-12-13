/**
 * API 配置管理服务
 * 用于管理系统中所有 API 接口的配置
 */

export interface ApiConfig {
  id: string;
  name: string;
  description: string;
  keyName: string;        // 环境变量名称
  value: string;          // 当前值（脱敏显示）
  actualValue?: string;   // 实际值（仅在编辑时使用）
  provider: string;       // 提供商
  docsUrl?: string;       // 文档链接
  status: 'configured' | 'not_configured' | 'invalid';
  category: 'ai' | 'data' | 'other';
  required: boolean;
}

// 系统预定义的 API 配置列表
const PREDEFINED_APIS: Omit<ApiConfig, 'value' | 'status' | 'actualValue'>[] = [
  // ========== AI 服务 ==========
  {
    id: 'openrouter',
    name: 'OpenRouter API',
    description: 'AI 服务网关 (优先使用 Gemini 2.0 Flash)',
    keyName: 'OPENROUTER_API_KEY',
    provider: 'OpenRouter',
    docsUrl: 'https://openrouter.ai/keys',
    category: 'ai',
    required: true
  },
  {
    id: 'deepseek',
    name: 'DeepSeek API',
    description: 'DeepSeek V3 对话模型 (备用)',
    keyName: 'DEEPSEEK_API_KEY',
    provider: 'DeepSeek',
    docsUrl: 'https://platform.deepseek.com/',
    category: 'ai',
    required: false
  },
  {
    id: 'gemini',
    name: 'Google Gemini API',
    description: 'Gemini 2.0 Flash 直连 (备用)',
    keyName: 'GEMINI_API_KEY',
    provider: 'Google',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    category: 'ai',
    required: false
  },
  // ========== 数据服务 ==========
  {
    id: 'apify',
    name: 'Apify API',
    description: 'Amazon/TikTok 数据抓取服务',
    keyName: 'VITE_APIFY_TOKEN',
    provider: 'Apify',
    docsUrl: 'https://console.apify.com/account/integrations',
    category: 'data',
    required: true
  },
  {
    id: 'rapidapi',
    name: 'RapidAPI (Real-Time Amazon)',
    description: 'Amazon 实时数据 API',
    keyName: 'RAPIDAPI_KEY',
    provider: 'RapidAPI',
    docsUrl: 'https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-amazon-data',
    category: 'data',
    required: false
  },
    // ========== 后端服务 ==========
  {
    id: 'backend_api',
    name: '后端 API 地址',
    description: 'TradeNexus 后端服务地址',
    keyName: 'VITE_API_BASE',
    provider: 'Self-hosted',
    docsUrl: '',
    category: 'other',
    required: false
  }
];

// 本地存储键名
const STORAGE_KEY = 'tradenexus_api_configs';

/**
 * 脱敏显示 API Key
 */
const maskApiKey = (key: string): string => {
  if (!key || key.length < 8) return '••••••••';
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
};

/**
 * 从环境变量获取 API Key
 */
const getEnvValue = (keyName: string): string => {
  // Vite 环境变量
  if (keyName.startsWith('VITE_')) {
    return (import.meta.env as any)[keyName] || '';
  }
  // 非 VITE_ 前缀的环境变量（如 API_KEY）
  return (import.meta.env as any)[keyName] || '';
};

/**
 * 从 localStorage 获取自定义配置
 */
const getStoredConfigs = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * 保存配置到 localStorage
 */
const saveStoredConfigs = (configs: Record<string, string>): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
};

/**
 * 获取所有 API 配置
 */
export const getAllApiConfigs = (): ApiConfig[] => {
  const storedConfigs = getStoredConfigs();
  
  return PREDEFINED_APIS.map(api => {
    // 优先使用 localStorage 中的值，其次是环境变量
    const storedValue = storedConfigs[api.keyName];
    const envValue = getEnvValue(api.keyName);
    const actualValue = storedValue || envValue;
    
    let status: ApiConfig['status'] = 'not_configured';
    if (actualValue && actualValue !== `your_${api.id}_key_here` && !actualValue.includes('your_')) {
      status = 'configured';
    }
    
    return {
      ...api,
      value: maskApiKey(actualValue),
      actualValue: actualValue,
      status
    };
  });
};

/**
 * 获取单个 API 配置
 */
export const getApiConfig = (id: string): ApiConfig | undefined => {
  return getAllApiConfigs().find(api => api.id === id);
};

/**
 * 更新 API 配置
 */
export const updateApiConfig = (id: string, newValue: string): boolean => {
  const api = PREDEFINED_APIS.find(a => a.id === id);
  if (!api) return false;
  
  const configs = getStoredConfigs();
  configs[api.keyName] = newValue;
  saveStoredConfigs(configs);
  
  // 触发自定义事件通知配置变更
  window.dispatchEvent(new CustomEvent('api-config-changed', { detail: { id, keyName: api.keyName } }));
  
  return true;
};

/**
 * 删除 API 配置（恢复为环境变量值）
 */
export const deleteApiConfig = (id: string): boolean => {
  const api = PREDEFINED_APIS.find(a => a.id === id);
  if (!api) return false;
  
  const configs = getStoredConfigs();
  delete configs[api.keyName];
  saveStoredConfigs(configs);
  
  window.dispatchEvent(new CustomEvent('api-config-changed', { detail: { id, keyName: api.keyName } }));
  
  return true;
};

/**
 * 添加自定义 API 配置
 */
export const addCustomApiConfig = (config: {
  name: string;
  keyName: string;
  value: string;
  description?: string;
  provider?: string;
  docsUrl?: string;
}): boolean => {
  // 检查是否已存在
  if (PREDEFINED_APIS.some(a => a.keyName === config.keyName)) {
    return false;
  }
  
  const configs = getStoredConfigs();
  configs[config.keyName] = config.value;
  
  // 保存自定义 API 元数据
  const customApis = getCustomApiMetas();
  customApis.push({
    id: `custom_${Date.now()}`,
    name: config.name,
    keyName: config.keyName,
    description: config.description || '',
    provider: config.provider || 'Custom',
    docsUrl: config.docsUrl,
    category: 'other' as const,
    required: false
  });
  localStorage.setItem(STORAGE_KEY + '_custom', JSON.stringify(customApis));
  
  saveStoredConfigs(configs);
  window.dispatchEvent(new CustomEvent('api-config-changed', { detail: { keyName: config.keyName } }));
  
  return true;
};

/**
 * 获取自定义 API 元数据
 */
const getCustomApiMetas = (): Omit<ApiConfig, 'value' | 'status' | 'actualValue'>[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY + '_custom');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * 获取实际的 API Key 值（用于 API 调用）
 */
export const getApiKeyValue = (keyName: string): string => {
  const storedConfigs = getStoredConfigs();
  return storedConfigs[keyName] || getEnvValue(keyName);
};

/**
 * 检查 API 是否已配置
 */
export const isApiConfigured = (id: string): boolean => {
  const config = getApiConfig(id);
  return config?.status === 'configured';
};

/**
 * 获取配置统计
 */
export const getConfigStats = (): { total: number; configured: number; required: number; requiredConfigured: number } => {
  const configs = getAllApiConfigs();
  const required = configs.filter(c => c.required);
  
  return {
    total: configs.length,
    configured: configs.filter(c => c.status === 'configured').length,
    required: required.length,
    requiredConfigured: required.filter(c => c.status === 'configured').length
  };
};
