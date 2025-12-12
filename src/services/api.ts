/**
 * TradeNexus API 调用层
 * 版本: v3.0
 * 
 * 统一管理后端 API 调用，支持离线模式降级
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// 存储 JWT Token
let authToken: string | null = null;

/**
 * 设置认证 Token
 */
export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('tradenexus_token', token);
  } else {
    localStorage.removeItem('tradenexus_token');
  }
};

/**
 * 获取认证 Token
 */
export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('tradenexus_token');
  }
  return authToken;
};

/**
 * API 请求封装
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; offline: boolean }> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: errorData.message || `HTTP ${response.status}`,
        offline: false,
      };
    }

    const data = await response.json();
    return { data, error: null, offline: false };
  } catch (error: any) {
    // 网络错误 - 可能是后端未启动
    console.warn('[API] 请求失败，可能处于离线模式:', error.message);
    return {
      data: null,
      error: '无法连接到服务器',
      offline: true,
    };
  }
}

// ============================================
// 认证 API
// ============================================

export const authApi = {
  /**
   * 用户注册
   */
  register: async (email: string, password: string, name?: string) => {
    const result = await apiRequest<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    
    if (result.data?.token) {
      setAuthToken(result.data.token);
    }
    
    return result;
  },

  /**
   * 用户登录
   */
  login: async (email: string, password: string) => {
    const result = await apiRequest<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (result.data?.token) {
      setAuthToken(result.data.token);
    }
    
    return result;
  },

  /**
   * 获取当前用户
   */
  me: async () => {
    return apiRequest<{ id: string; email: string; name: string }>('/auth/me');
  },

  /**
   * 登出
   */
  logout: () => {
    setAuthToken(null);
  },
};

// ============================================
// 产品 API
// ============================================

export const productsApi = {
  /**
   * 获取产品列表
   */
  list: async (options?: { status?: string; platform?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.platform) params.append('platform', options.platform);
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    
    const query = params.toString();
    return apiRequest<{ data: any[]; pagination: any }>(`/products${query ? `?${query}` : ''}`);
  },

  /**
   * 获取产品详情
   */
  get: async (id: string) => {
    return apiRequest<any>(`/products/${id}`);
  },

  /**
   * 创建产品
   */
  create: async (data: {
    platform: string;
    platformId: string;
    title: string;
    imageUrl?: string;
    sellPrice?: number;
    currency?: string;
    category?: string;
  }) => {
    return apiRequest<any>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新产品
   */
  update: async (id: string, data: Partial<{ title: string; status: string }>) => {
    return apiRequest<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除产品
   */
  delete: async (id: string) => {
    return apiRequest<any>(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// 供应链 API
// ============================================

export const sourcingApi = {
  // ========== 公开 API (无需认证) ==========

  /**
   * 搜索 1688 货源 (公开)
   */
  search1688: async (keyword: string, limit: number = 10, sortBy: 'price' | 'sales' | 'rating' = 'rating') => {
    return apiRequest<any[]>(`/sourcing/1688/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}&sortBy=${sortBy}`);
  },

  /**
   * 翻译关键词为中文 (公开)
   */
  translateKeyword: async (keyword: string) => {
    return apiRequest<{ original: string; translations: string[] }>(`/sourcing/1688/translate?keyword=${encodeURIComponent(keyword)}`);
  },

  /**
   * 快速利润计算 (公开)
   */
  quickProfit: async (sourcingPrice: number, sellingPrice: number, options?: {
    shippingCost?: number;
    platformFee?: number;
    exchangeRate?: number;
  }) => {
    return apiRequest<{ margin: number; profit: number; roi: number }>('/sourcing/1688/profit', {
      method: 'POST',
      body: JSON.stringify({ sourcingPrice, sellingPrice, ...options }),
    });
  },

  // ========== 需要认证的 API ==========

  /**
   * 搜索 1688 货源 (需认证)
   */
  search: async (productId: string, options: { imageUrl?: string; keywords?: string }) => {
    return apiRequest<any[]>(`/sourcing/search/${productId}`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  },

  /**
   * 获取产品货源列表
   */
  getResults: async (productId: string) => {
    return apiRequest<any[]>(`/sourcing/results/${productId}`);
  },

  /**
   * 计算利润
   */
  calculateProfit: async (params: {
    sellPrice: number;
    costPrice: number;
    weight: number;
    shippingPerKg?: number;
    referralFee?: number;
    fbaFee?: number;
    marketingCost?: number;
    exchangeRate?: number;
  }) => {
    return apiRequest<any>('/sourcing/profit/calculate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * 保存利润计算结果
   */
  saveProfit: async (data: {
    productId: string;
    sourcingId: string;
    sellPrice: number;
    costPrice: number;
    weight: number;
  }) => {
    return apiRequest<any>('/sourcing/profit/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// 合规 API
// ============================================

export const complianceApi = {
  /**
   * 检查产品合规性
   */
  check: async (productId: string, market: string, category: string) => {
    return apiRequest<any>(`/compliance/check/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ market, category }),
    });
  },

  /**
   * 获取合规检查记录
   */
  getResults: async (productId: string) => {
    return apiRequest<any[]>(`/compliance/results/${productId}`);
  },

  /**
   * 匹配 HS 编码
   */
  matchHsCode: async (description: string, market: string) => {
    return apiRequest<{ hsCode: string; description: string; taxRate: number; notes: string }>(
      '/compliance/hs-code',
      {
        method: 'POST',
        body: JSON.stringify({ description, market }),
      }
    );
  },
};

// ============================================
// AI API
// ============================================

export const aiApi = {
  /**
   * 产品市场分析
   */
  analyze: async (query: string, context?: any) => {
    return apiRequest<any>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ query, context }),
    });
  },

  /**
   * 翻译为中文搜索词
   */
  translate: async (title: string) => {
    return apiRequest<string[]>('/ai/translate', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  /**
   * 一键爆款复刻工作流
   */
  replicationWorkflow: async (amazonUrl: string) => {
    return apiRequest<any>('/ai/workflow/replication', {
      method: 'POST',
      body: JSON.stringify({ amazonUrl }),
    });
  },
};

// ============================================
// 任务 API
// ============================================

export const jobsApi = {
  /**
   * 创建任务
   */
  create: async (type: string, inputData: any) => {
    return apiRequest<any>('/jobs', {
      method: 'POST',
      body: JSON.stringify({ type, inputData }),
    });
  },

  /**
   * 获取任务列表
   */
  list: async (options?: { status?: string; type?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.type) params.append('type', options.type);
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    
    const query = params.toString();
    return apiRequest<{ data: any[]; pagination: any }>(`/jobs${query ? `?${query}` : ''}`);
  },

  /**
   * 获取任务详情
   */
  get: async (id: string) => {
    return apiRequest<any>(`/jobs/${id}`);
  },
};

// ============================================
// 健康检查
// ============================================

export const healthCheck = async (): Promise<{ online: boolean; version?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (response.ok) {
      const data = await response.json();
      return { online: true, version: data.version };
    }
    return { online: false };
  } catch {
    return { online: false };
  }
};
