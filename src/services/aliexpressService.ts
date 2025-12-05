// AliExpress 数据服务
// 价格对比和利润空间计算

// AliExpress 产品数据接口
export interface AliExpressProductData {
    productId: string;
    title: string;
    price: number;
    originalPrice: number | null;
    currency: string;
    minOrder: number;
    shippingCost: number | null;
    shippingTime: string | null;  // 如 "15-30 days"
    rating: number | null;
    orders: string | null;  // 如 "5000+ orders"
    mainImage: string;
    sellerName: string;
    sellerRating: number | null;
    link: string;
    category: string | null;
    fetchedAt: number;
    dataSource: 'real' | 'mock';
}

// 利润计算结果
export interface ProfitCalculation {
    amazonPrice: number;
    aliexpressPrice: number;
    shippingCost: number;
    platformFee: number;  // Amazon 通常 15%
    estimatedProfit: number;
    profitMargin: number;  // 百分比
    roi: number;  // 投资回报率
    recommendation: 'excellent' | 'good' | 'marginal' | 'not_recommended';
}

// 模拟 AliExpress 产品数据
const mockAliExpressProducts: Record<string, AliExpressProductData[]> = {
    'pet feeder': [
        {
            productId: 'AE001',
            title: 'Automatic Pet Feeder Smart WiFi Dog Cat Food Dispenser 6L',
            price: 18.50,
            originalPrice: 35.00,
            currency: 'USD',
            minOrder: 1,
            shippingCost: 5.99,
            shippingTime: '15-25 days',
            rating: 4.7,
            orders: '8000+ orders',
            mainImage: 'https://picsum.photos/400/400?random=801',
            sellerName: 'Pet Smart Factory',
            sellerRating: 4.8,
            link: 'https://www.aliexpress.com/item/AE001.html',
            category: 'Pet Supplies',
            fetchedAt: Date.now(),
            dataSource: 'mock'
        },
        {
            productId: 'AE002',
            title: 'Smart Automatic Cat Dog Feeder with Camera App Control',
            price: 25.80,
            originalPrice: 52.00,
            currency: 'USD',
            minOrder: 1,
            shippingCost: 0,  // 包邮
            shippingTime: '20-35 days',
            rating: 4.6,
            orders: '5500+ orders',
            mainImage: 'https://picsum.photos/400/400?random=802',
            sellerName: 'Home Pet Electronics',
            sellerRating: 4.7,
            link: 'https://www.aliexpress.com/item/AE002.html',
            category: 'Pet Supplies',
            fetchedAt: Date.now(),
            dataSource: 'mock'
        }
    ],
    'wireless earbuds': [
        {
            productId: 'AE003',
            title: 'TWS Bluetooth 5.3 Earbuds Active Noise Cancelling Wireless Headphones',
            price: 8.50,
            originalPrice: 25.00,
            currency: 'USD',
            minOrder: 2,
            shippingCost: 2.99,
            shippingTime: '10-20 days',
            rating: 4.5,
            orders: '20000+ orders',
            mainImage: 'https://picsum.photos/400/400?random=803',
            sellerName: 'Audio Factory Direct',
            sellerRating: 4.6,
            link: 'https://www.aliexpress.com/item/AE003.html',
            category: 'Electronics',
            fetchedAt: Date.now(),
            dataSource: 'mock'
        }
    ]
};

// 生成通用模拟产品
const generateMockAliExpressProduct = (query: string, index: number): AliExpressProductData => ({
    productId: `AE${Date.now()}_${index}`,
    title: `${query} - Factory Direct Wholesale #${index + 1}`,
    price: Math.floor(Math.random() * 20) + 5,
    originalPrice: Math.floor(Math.random() * 50) + 20,
    currency: 'USD',
    minOrder: Math.floor(Math.random() * 5) + 1,
    shippingCost: Math.random() > 0.3 ? Number((Math.random() * 10).toFixed(2)) : 0,
    shippingTime: `${Math.floor(Math.random() * 15) + 10}-${Math.floor(Math.random() * 20) + 25} days`,
    rating: Number((Math.random() * 0.5 + 4.3).toFixed(1)),
    orders: `${Math.floor(Math.random() * 10000) + 500}+ orders`,
    mainImage: `https://picsum.photos/400/400?random=${900 + index}`,
    sellerName: `Supplier ${index + 1}`,
    sellerRating: Number((Math.random() * 0.4 + 4.5).toFixed(1)),
    link: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`,
    category: 'Various',
    fetchedAt: Date.now(),
    dataSource: 'mock'
});

/**
 * 检测当前数据源模式
 */
export const getAliExpressDataSourceMode = (): 'real' | 'mock' => {
    const apiKey = import.meta.env.VITE_ALIEXPRESS_API_KEY;
    return apiKey ? 'real' : 'mock';
};

/**
 * 搜索 AliExpress 产品
 */
export const searchAliExpressProducts = async (
    query: string,
    limit: number = 5
): Promise<AliExpressProductData[]> => {
    const dataMode = getAliExpressDataSourceMode();
    console.log(`[AliExpress] 搜索产品 "${query}"，模式: ${dataMode}`);

    // 真实 API 调用（需要 API Key）
    if (dataMode === 'real') {
        try {
            // TODO: 集成真实 AliExpress API
            console.log('[AliExpress] 真实 API 模式 - 使用模拟数据演示');
        } catch (error) {
            console.error('[AliExpress] API 调用失败:', error);
        }
    }

    // 模拟数据模式
    await new Promise(resolve => setTimeout(resolve, 600));

    const queryLower = query.toLowerCase();
    const matchedProducts = mockAliExpressProducts[queryLower];

    if (matchedProducts) {
        return matchedProducts.slice(0, limit);
    }

    return Array.from({ length: limit }, (_, i) => generateMockAliExpressProduct(query, i));
};

/**
 * 计算利润空间
 */
export const calculateProfit = (
    amazonPrice: number,
    aliexpressPrice: number,
    shippingCost: number = 0,
    platformFeeRate: number = 0.15  // Amazon 默认 15%
): ProfitCalculation => {
    const platformFee = amazonPrice * platformFeeRate;
    const totalCost = aliexpressPrice + shippingCost;
    const estimatedProfit = amazonPrice - totalCost - platformFee;
    const profitMargin = (estimatedProfit / amazonPrice) * 100;
    const roi = (estimatedProfit / totalCost) * 100;

    let recommendation: ProfitCalculation['recommendation'];
    if (profitMargin >= 40) {
        recommendation = 'excellent';
    } else if (profitMargin >= 25) {
        recommendation = 'good';
    } else if (profitMargin >= 10) {
        recommendation = 'marginal';
    } else {
        recommendation = 'not_recommended';
    }

    return {
        amazonPrice,
        aliexpressPrice,
        shippingCost,
        platformFee: Number(platformFee.toFixed(2)),
        estimatedProfit: Number(estimatedProfit.toFixed(2)),
        profitMargin: Number(profitMargin.toFixed(1)),
        roi: Number(roi.toFixed(1)),
        recommendation
    };
};

/**
 * 价格对比分析
 */
export const comparePrices = async (
    query: string,
    amazonPrice: number
): Promise<{
    aliexpressProducts: AliExpressProductData[];
    profitAnalysis: ProfitCalculation[];
    bestDeal: { product: AliExpressProductData; profit: ProfitCalculation } | null;
}> => {
    const aliexpressProducts = await searchAliExpressProducts(query, 5);

    const profitAnalysis = aliexpressProducts.map(product =>
        calculateProfit(amazonPrice, product.price, product.shippingCost || 0)
    );

    // 找出最佳交易
    let bestDeal: { product: AliExpressProductData; profit: ProfitCalculation } | null = null;
    let maxProfit = -Infinity;

    aliexpressProducts.forEach((product, index) => {
        if (profitAnalysis[index].estimatedProfit > maxProfit) {
            maxProfit = profitAnalysis[index].estimatedProfit;
            bestDeal = { product, profit: profitAnalysis[index] };
        }
    });

    return {
        aliexpressProducts,
        profitAnalysis,
        bestDeal
    };
};
