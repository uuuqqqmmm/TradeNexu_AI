/**
 * 1688 供应链服务
 * 版本: v3.0
 * 
 * 核心功能:
 * 1. 以图搜图 - 用 Amazon 产品图在 1688 找同款
 * 2. 关键词搜索 - 中文关键词搜索供应商
 * 3. 利润试算 - 计算采购成本和预估利润
 * 
 * 当前状态: Mock 数据模式
 * TODO: Phase 3 Sprint 2 集成真实 API
 */

// 1688 产品数据接口
export interface Alibaba1688Product {
  productId: string;
  title: string;
  price: number;              // 采购价 (CNY)
  priceRange?: string;        // 价格区间 "38.5-45.0"
  moq: number;                // 最小起订量
  currency: string;
  mainImage: string;
  detailUrl: string;
  supplierName: string;
  supplierUrl: string;
  supplierRating: number;     // 供应商评分 0-5
  shopYears: number;          // 开店年限
  repeatBuyRate?: number;     // 回头率 0-100
  responseTime?: string;      // 响应时间
  location: string;           // 发货地
  salesCount?: string;        // 销量
  matchScore?: number;        // AI 匹配度 0-1
  fetchedAt: number;
  dataSource: 'real' | 'mock';
}

// 搜索参数
export interface Search1688Params {
  keyword?: string;
  imageUrl?: string;
  minPrice?: number;
  maxPrice?: number;
  minMoq?: number;
  maxMoq?: number;
  sortBy?: 'price' | 'sales' | 'rating';
  limit?: number;
}

// 利润计算参数
export interface ProfitCalculationParams {
  sellPrice: number;          // Amazon 售价 (USD)
  costPrice: number;          // 1688 采购价 (CNY)
  weight: number;             // 产品重量 (kg)
  quantity?: number;          // 采购数量
  shippingPerKg?: number;     // 头程运费 (CNY/kg)
  referralFee?: number;       // 平台佣金比例
  fbaFee?: number;            // FBA 费用 (USD)
  marketingCost?: number;     // 广告费 (USD)
  exchangeRate?: number;      // 汇率
}

// 利润计算结果
export interface ProfitResult {
  sellPrice: number;
  sellPriceCNY: number;
  costPrice: number;
  shippingCost: number;
  platformFee: number;
  fbaFee: number;
  marketingCost: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;       // 百分比
  roi: number;                // 投资回报率
  exchangeRate: number;
  breakEvenQuantity: number;  // 盈亏平衡数量
  recommendation: string;     // AI 建议
}

// ============================================
// Mock 数据
// ============================================

const mockProducts: Record<string, Alibaba1688Product[]> = {
  'pet feeder': [
    {
      productId: '1688-001',
      title: '智能宠物喂食器 自动定时投食机 猫狗通用 WiFi远程控制',
      price: 45.00,
      priceRange: '38.5-52.0',
      moq: 100,
      currency: 'CNY',
      mainImage: 'https://cbu01.alicdn.com/img/ibank/O1CN01example1.jpg',
      detailUrl: 'https://detail.1688.com/offer/123456789.html',
      supplierName: '深圳智宠科技有限公司',
      supplierUrl: 'https://shop123.1688.com',
      supplierRating: 4.8,
      shopYears: 5,
      repeatBuyRate: 35,
      responseTime: '1小时内',
      location: '广东 深圳',
      salesCount: '5000+',
      matchScore: 0.92,
      fetchedAt: Date.now(),
      dataSource: 'mock',
    },
    {
      productId: '1688-002',
      title: '大容量宠物自动喂食器 6L储粮 双供电 APP控制',
      price: 38.50,
      priceRange: '35.0-42.0',
      moq: 200,
      currency: 'CNY',
      mainImage: 'https://cbu01.alicdn.com/img/ibank/O1CN01example2.jpg',
      detailUrl: 'https://detail.1688.com/offer/987654321.html',
      supplierName: '广州优品电子厂',
      supplierUrl: 'https://shop456.1688.com',
      supplierRating: 4.5,
      shopYears: 3,
      repeatBuyRate: 28,
      responseTime: '2小时内',
      location: '广东 广州',
      salesCount: '3000+',
      matchScore: 0.85,
      fetchedAt: Date.now(),
      dataSource: 'mock',
    },
    {
      productId: '1688-003',
      title: '宠物智能喂食器 摄像头版 语音互动 远程投食',
      price: 68.00,
      priceRange: '62.0-75.0',
      moq: 50,
      currency: 'CNY',
      mainImage: 'https://cbu01.alicdn.com/img/ibank/O1CN01example3.jpg',
      detailUrl: 'https://detail.1688.com/offer/456789123.html',
      supplierName: '东莞智能家居科技',
      supplierUrl: 'https://shop789.1688.com',
      supplierRating: 4.9,
      shopYears: 7,
      repeatBuyRate: 42,
      responseTime: '30分钟内',
      location: '广东 东莞',
      salesCount: '8000+',
      matchScore: 0.88,
      fetchedAt: Date.now(),
      dataSource: 'mock',
    },
  ],
  'wireless earbuds': [
    {
      productId: '1688-101',
      title: 'TWS蓝牙耳机 真无线降噪 触控操作 超长续航',
      price: 25.00,
      priceRange: '22.0-30.0',
      moq: 500,
      currency: 'CNY',
      mainImage: 'https://cbu01.alicdn.com/img/ibank/O1CN01earbuds1.jpg',
      detailUrl: 'https://detail.1688.com/offer/111222333.html',
      supplierName: '深圳声科电子有限公司',
      supplierUrl: 'https://shop111.1688.com',
      supplierRating: 4.7,
      shopYears: 6,
      repeatBuyRate: 38,
      responseTime: '1小时内',
      location: '广东 深圳',
      salesCount: '50000+',
      matchScore: 0.90,
      fetchedAt: Date.now(),
      dataSource: 'mock',
    },
  ],
  'led strip lights': [
    {
      productId: '1688-201',
      title: 'RGB LED灯带 5050贴片 遥控变色 防水 10米套装',
      price: 12.50,
      priceRange: '10.0-15.0',
      moq: 100,
      currency: 'CNY',
      mainImage: 'https://cbu01.alicdn.com/img/ibank/O1CN01ledstrip1.jpg',
      detailUrl: 'https://detail.1688.com/offer/222333444.html',
      supplierName: '中山照明科技',
      supplierUrl: 'https://shop222.1688.com',
      supplierRating: 4.6,
      shopYears: 8,
      repeatBuyRate: 45,
      responseTime: '1小时内',
      location: '广东 中山',
      salesCount: '100000+',
      matchScore: 0.95,
      fetchedAt: Date.now(),
      dataSource: 'mock',
    },
  ],
};

// ============================================
// 服务函数
// ============================================

/**
 * 获取数据源模式
 */
export const get1688DataSourceMode = (): 'real' | 'mock' => {
  // TODO: 检查 1688 API 配置
  // const apiKey = import.meta.env.VITE_1688_API_KEY;
  // return apiKey ? 'real' : 'mock';
  return 'mock';
};

/**
 * 搜索 1688 产品
 */
export const search1688Products = async (
  params: Search1688Params
): Promise<Alibaba1688Product[]> => {
  const { keyword, imageUrl, sortBy = 'rating', limit = 10 } = params;
  const dataMode = get1688DataSourceMode();

  console.log(`[1688] 搜索产品，关键词: "${keyword}", 模式: ${dataMode}`);

  // 真实 API 调用 (TODO: Phase 3 Sprint 2)
  if (dataMode === 'real') {
    try {
      // TODO: 集成 1688 API 或爬虫服务
      console.log('[1688] 真实 API 模式 - 待实现');
    } catch (error) {
      console.error('[1688] API 调用失败:', error);
    }
  }

  // Mock 数据模式
  await new Promise(resolve => setTimeout(resolve, 800));

  const keywordLower = (keyword || '').toLowerCase();
  
  // 查找匹配的 Mock 数据
  let results: Alibaba1688Product[] = [];
  
  for (const [key, products] of Object.entries(mockProducts)) {
    if (keywordLower.includes(key) || key.includes(keywordLower)) {
      results = [...results, ...products];
    }
  }

  // 如果没有匹配，生成通用 Mock 数据
  if (results.length === 0) {
    results = generateMock1688Products(keyword || 'product', 3);
  }

  // 排序
  if (sortBy === 'price') {
    results.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'sales') {
    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  } else {
    results.sort((a, b) => b.supplierRating - a.supplierRating);
  }

  return results.slice(0, limit);
};

/**
 * 以图搜图
 */
export const searchByImage = async (
  imageUrl: string,
  limit: number = 5
): Promise<Alibaba1688Product[]> => {
  console.log(`[1688] 以图搜图: ${imageUrl}`);

  // TODO: 集成 1688 以图搜图 API
  // 目前返回 Mock 数据
  await new Promise(resolve => setTimeout(resolve, 1200));

  return generateMock1688Products('similar product', limit);
};

/**
 * 生成 Mock 产品数据
 */
const generateMock1688Products = (
  keyword: string,
  count: number
): Alibaba1688Product[] => {
  return Array.from({ length: count }, (_, i) => ({
    productId: `1688-mock-${Date.now()}-${i}`,
    title: `${keyword} 工厂直销 OEM定制 品质保证 - 款式${i + 1}`,
    price: Math.round((20 + Math.random() * 80) * 100) / 100,
    priceRange: `${15 + i * 5}.0-${25 + i * 5}.0`,
    moq: [50, 100, 200, 500][i % 4],
    currency: 'CNY',
    mainImage: `https://picsum.photos/400/400?random=${Date.now() + i}`,
    detailUrl: `https://detail.1688.com/offer/mock${Date.now()}${i}.html`,
    supplierName: ['深圳优品科技', '广州制造工厂', '东莞电子有限公司', '义乌小商品批发'][i % 4],
    supplierUrl: `https://shop${i}.1688.com`,
    supplierRating: Math.round((4 + Math.random()) * 10) / 10,
    shopYears: Math.floor(2 + Math.random() * 8),
    repeatBuyRate: Math.floor(20 + Math.random() * 30),
    responseTime: ['30分钟内', '1小时内', '2小时内'][i % 3],
    location: ['广东 深圳', '广东 广州', '浙江 义乌', '福建 厦门'][i % 4],
    salesCount: `${Math.floor(1000 + Math.random() * 9000)}+`,
    matchScore: Math.round((0.7 + Math.random() * 0.25) * 100) / 100,
    fetchedAt: Date.now(),
    dataSource: 'mock' as const,
  }));
};

/**
 * 计算利润
 */
export const calculateProfit = (params: ProfitCalculationParams): ProfitResult => {
  const {
    sellPrice,
    costPrice,
    weight,
    quantity = 1,
    shippingPerKg = 30,
    referralFee = 0.15,
    fbaFee = 5,
    marketingCost = 2,
    exchangeRate = 7.2,
  } = params;

  // 转换为 CNY 计算
  const sellPriceCNY = sellPrice * exchangeRate;
  const platformFeeCNY = sellPrice * referralFee * exchangeRate;
  const fbaFeeCNY = fbaFee * exchangeRate;
  const marketingCostCNY = marketingCost * exchangeRate;
  const shippingCost = weight * shippingPerKg;

  // 总成本
  const totalCost = costPrice + shippingCost + platformFeeCNY + fbaFeeCNY + marketingCostCNY;

  // 净利润
  const netProfit = sellPriceCNY - totalCost;

  // 利润率
  const profitMargin = (netProfit / sellPriceCNY) * 100;

  // ROI
  const roi = (netProfit / (costPrice + shippingCost)) * 100;

  // 盈亏平衡数量 (假设固定成本 1000 CNY)
  const fixedCost = 1000;
  const breakEvenQuantity = netProfit > 0 ? Math.ceil(fixedCost / netProfit) : Infinity;

  // 生成建议
  let recommendation = '';
  if (profitMargin >= 30) {
    recommendation = '✅ 利润率优秀，建议重点开发此产品';
  } else if (profitMargin >= 20) {
    recommendation = '👍 利润率良好，可以考虑入场';
  } else if (profitMargin >= 10) {
    recommendation = '⚠️ 利润率一般，需要优化供应链或提高售价';
  } else {
    recommendation = '❌ 利润率过低，不建议开发此产品';
  }

  return {
    sellPrice,
    sellPriceCNY: Math.round(sellPriceCNY * 100) / 100,
    costPrice,
    shippingCost: Math.round(shippingCost * 100) / 100,
    platformFee: Math.round(platformFeeCNY * 100) / 100,
    fbaFee: Math.round(fbaFeeCNY * 100) / 100,
    marketingCost: Math.round(marketingCostCNY * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    exchangeRate,
    breakEvenQuantity,
    recommendation,
  };
};

/**
 * 翻译英文关键词为中文搜索词
 * TODO: 集成 Gemini API 进行智能翻译
 */
export const translateToChineseKeywords = async (
  englishKeywords: string
): Promise<string[]> => {
  // Mock 翻译映射
  const translations: Record<string, string[]> = {
    'pet feeder': ['宠物喂食器', '自动投食机', '猫狗喂食器'],
    'wireless earbuds': ['蓝牙耳机', 'TWS耳机', '无线耳机'],
    'led strip': ['LED灯带', 'RGB灯条', '装饰灯带'],
    'phone case': ['手机壳', '手机保护套', '硅胶手机壳'],
    'smart watch': ['智能手表', '运动手环', '蓝牙手表'],
  };

  const keyLower = englishKeywords.toLowerCase();
  
  for (const [key, values] of Object.entries(translations)) {
    if (keyLower.includes(key)) {
      return values;
    }
  }

  // 默认返回原词
  return [englishKeywords];
};

/**
 * 获取供应商详情
 */
export const getSupplierDetails = async (
  supplierUrl: string
): Promise<{
  name: string;
  rating: number;
  shopYears: number;
  mainProducts: string[];
  certifications: string[];
  contact?: { wechat?: string; phone?: string };
}> => {
  // Mock 数据
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    name: '深圳优品科技有限公司',
    rating: 4.8,
    shopYears: 5,
    mainProducts: ['智能家居', '宠物用品', '电子配件'],
    certifications: ['ISO9001', '3C认证', 'CE认证'],
    contact: {
      wechat: 'supplier_wx_123',
      phone: '0755-12345678',
    },
  };
};
