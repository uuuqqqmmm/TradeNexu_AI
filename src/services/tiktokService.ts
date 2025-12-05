// TikTok Shop 数据服务
// 集成 TikTok Shop 产品数据获取（使用模拟+真实API混合模式）
import { AmazonProductData } from '../types';

// TikTok 产品数据接口
export interface TikTokProductData {
    productId: string;
    title: string;
    price: number | null;
    originalPrice: number | null;
    currency: string;
    salesCount: string | null;  // 如 "10K+ sold"
    rating: number | null;
    reviewCount: number | null;
    mainImage: string;
    videoViews: string | null;  // 如 "1.2M views"
    shopName: string;
    shopRating: number | null;
    link: string;
    category: string | null;
    fetchedAt: number;
    dataSource: 'real' | 'mock';
}

// TikTok 调研查询参数
export interface TikTokResearchQuery {
    query: string;
    region?: string;  // US, UK, ID, TH, VN, MY, PH, SG
    sortBy?: 'sales' | 'price_asc' | 'price_desc' | 'newest';
}

// 支持的 TikTok Shop 地区
export const TIKTOK_REGIONS = [
    { code: 'US', name: '美国站 (TikTok Shop US)', domain: 'tiktokshop.com' },
    { code: 'UK', name: '英国站 (TikTok Shop UK)', domain: 'tiktok.com/shop' },
    { code: 'ID', name: '印尼站 (TikTok Shop ID)', domain: 'tokopedia.com' },
    { code: 'TH', name: '泰国站 (TikTok Shop TH)', domain: 'tiktok.com/shop' },
    { code: 'VN', name: '越南站 (TikTok Shop VN)', domain: 'tiktok.com/shop' },
    { code: 'MY', name: '马来西亚站 (TikTok Shop MY)', domain: 'tiktok.com/shop' },
];

// 模拟 TikTok 热销产品数据
const mockTikTokProducts: Record<string, TikTokProductData[]> = {
    'pet feeder': [
        {
            productId: 'TT001',
            title: 'Smart Pet Feeder with Camera - WiFi Auto Dog Cat Food Dispenser',
            price: 45.99,
            originalPrice: 89.99,
            currency: 'USD',
            salesCount: '50K+ sold',
            rating: 4.8,
            reviewCount: 12500,
            mainImage: 'https://picsum.photos/400/400?random=501',
            videoViews: '2.5M views',
            shopName: 'PetTech Official',
            shopRating: 4.9,
            link: 'https://www.tiktok.com/shop/product/TT001',
            category: 'Pet Supplies',
            fetchedAt: Date.now(),
            dataSource: 'mock'
        },
        {
            productId: 'TT002',
            title: 'Automatic Cat Feeder 6L - Smart Timer Pet Food Dispenser',
            price: 35.99,
            originalPrice: 59.99,
            currency: 'USD',
            salesCount: '30K+ sold',
            rating: 4.7,
            reviewCount: 8900,
            mainImage: 'https://picsum.photos/400/400?random=502',
            videoViews: '1.8M views',
            shopName: 'Smart Home Pets',
            shopRating: 4.8,
            link: 'https://www.tiktok.com/shop/product/TT002',
            category: 'Pet Supplies',
            fetchedAt: Date.now(),
            dataSource: 'mock'
        }
    ],
    'wireless earbuds': [
        {
            productId: 'TT003',
            title: 'Pro Wireless Earbuds - Active Noise Cancelling TWS Bluetooth 5.3',
            price: 29.99,
            originalPrice: 79.99,
            currency: 'USD',
            salesCount: '100K+ sold',
            rating: 4.6,
            reviewCount: 25000,
            mainImage: 'https://picsum.photos/400/400?random=503',
            videoViews: '5M views',
            shopName: 'AudioTech Store',
            shopRating: 4.7,
            link: 'https://www.tiktok.com/shop/product/TT003',
            category: 'Electronics',
            fetchedAt: Date.now(),
            dataSource: 'mock'
        }
    ]
};

// 生成通用模拟产品
const generateMockTikTokProduct = (query: string, index: number): TikTokProductData => ({
    productId: `TT${Date.now()}_${index}`,
    title: `${query} - Viral TikTok Hot Seller #${index + 1}`,
    price: Math.floor(Math.random() * 50) + 10,
    originalPrice: Math.floor(Math.random() * 100) + 50,
    currency: 'USD',
    salesCount: `${Math.floor(Math.random() * 100) + 10}K+ sold`,
    rating: Number((Math.random() * 0.5 + 4.5).toFixed(1)),
    reviewCount: Math.floor(Math.random() * 10000) + 1000,
    mainImage: `https://picsum.photos/400/400?random=${600 + index}`,
    videoViews: `${(Math.random() * 5 + 0.5).toFixed(1)}M views`,
    shopName: `TikTok Shop ${index + 1}`,
    shopRating: Number((Math.random() * 0.3 + 4.6).toFixed(1)),
    link: `https://www.tiktok.com/shop/search?q=${encodeURIComponent(query)}`,
    category: 'Trending',
    fetchedAt: Date.now(),
    dataSource: 'mock'
});

/**
 * 检测当前数据源模式
 */
export const getTikTokDataSourceMode = (): 'real' | 'mock' => {
    const apiKey = import.meta.env.VITE_TIKTOK_API_KEY;
    return apiKey ? 'real' : 'mock';
};

/**
 * 搜索 TikTok Shop 产品
 */
export const searchTikTokProducts = async (
    query: string,
    region: string = 'US',
    limit: number = 5
): Promise<TikTokProductData[]> => {
    const dataMode = getTikTokDataSourceMode();
    console.log(`[TikTok] 搜索产品 "${query}" 地区: ${region}，模式: ${dataMode}`);

    // 真实 API 调用（需要 API Key）
    if (dataMode === 'real') {
        try {
            // TODO: 集成真实 TikTok Shop API（如 Kalodata 或 ScrapeCreators）
            // const response = await fetch(`https://api.kalodata.com/tiktok/search?q=${encodeURIComponent(query)}&region=${region}`, {
            //   headers: { 'Authorization': `Bearer ${import.meta.env.VITE_TIKTOK_API_KEY}` }
            // });
            // return await response.json();
            console.log('[TikTok] 真实 API 模式 - 使用模拟数据演示');
        } catch (error) {
            console.error('[TikTok] API 调用失败:', error);
        }
    }

    // 模拟数据模式
    await new Promise(resolve => setTimeout(resolve, 800));

    const queryLower = query.toLowerCase();
    const matchedProducts = mockTikTokProducts[queryLower];

    if (matchedProducts) {
        return matchedProducts.slice(0, limit);
    }

    // 生成通用模拟数据
    return Array.from({ length: limit }, (_, i) => generateMockTikTokProduct(query, i));
};

/**
 * 获取 TikTok 热门趋势产品
 */
export const getTikTokTrendingProducts = async (
    region: string = 'US',
    category?: string
): Promise<TikTokProductData[]> => {
    console.log(`[TikTok] 获取热门趋势 地区: ${region}，分类: ${category || '全部'}`);

    // 返回预设的热门产品
    const trendingProducts: TikTokProductData[] = [
        {
            productId: 'TREND001',
            title: 'Viral LED Sunset Lamp - Rainbow Projection Night Light',
            price: 15.99,
            originalPrice: 35.99,
            currency: 'USD',
            salesCount: '200K+ sold',
            rating: 4.5,
            reviewCount: 50000,
            mainImage: 'https://picsum.photos/400/400?random=701',
            videoViews: '10M views',
            shopName: 'Aesthetic Home',
            shopRating: 4.8,
            link: 'https://www.tiktok.com/shop/product/TREND001',
            category: 'Home Decor',
            fetchedAt: Date.now(),
            dataSource: 'mock'
        },
        {
            productId: 'TREND002',
            title: 'Cloud Slides - Super Soft Pillow Slippers',
            price: 12.99,
            originalPrice: 29.99,
            currency: 'USD',
            salesCount: '500K+ sold',
            rating: 4.7,
            reviewCount: 100000,
            mainImage: 'https://picsum.photos/400/400?random=702',
            videoViews: '25M views',
            shopName: 'Comfort Zone',
            shopRating: 4.9,
            link: 'https://www.tiktok.com/shop/product/TREND002',
            category: 'Shoes',
            fetchedAt: Date.now(),
            dataSource: 'mock'
        },
        {
            productId: 'TREND003',
            title: 'Mini Portable Blender - USB Rechargeable Juicer',
            price: 19.99,
            originalPrice: 45.99,
            currency: 'USD',
            salesCount: '150K+ sold',
            rating: 4.6,
            reviewCount: 35000,
            mainImage: 'https://picsum.photos/400/400?random=703',
            videoViews: '8M views',
            shopName: 'Kitchen Gadgets',
            shopRating: 4.7,
            link: 'https://www.tiktok.com/shop/product/TREND003',
            category: 'Kitchen',
            fetchedAt: Date.now(),
            dataSource: 'mock'
        }
    ];

    await new Promise(resolve => setTimeout(resolve, 500));
    return trendingProducts;
};
