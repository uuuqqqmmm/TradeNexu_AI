// TikTok Shop 数据服务
// 集成 Apify TikTok Scraper API 获取真实数据
import { AmazonProductData } from '../types';

// Apify API 配置
const APIFY_BASE_URL = 'https://api.apify.com/v2';
const TIKTOK_SCRAPER_ACTOR_ID = 'clockworks~tiktok-scraper'; // Apify TikTok Scraper Actor

// 获取 Apify Token
const getApifyToken = (): string | null => {
    const token = import.meta.env.VITE_APIFY_TOKEN;
    return token && token !== 'your_apify_token_here' ? token : null;
};

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
    return getApifyToken() ? 'real' : 'mock';
};

/**
 * 调用 Apify Actor 并等待结果
 */
const runApifyActor = async (input: Record<string, any>): Promise<any[]> => {
    const token = getApifyToken();
    if (!token) {
        throw new Error('Apify Token 未配置');
    }

    console.log('[TikTok] 调用 Apify Actor...', input);

    // 启动 Actor 运行
    const runResponse = await fetch(
        `${APIFY_BASE_URL}/acts/${TIKTOK_SCRAPER_ACTOR_ID}/runs?token=${token}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        }
    );

    if (!runResponse.ok) {
        const errorText = await runResponse.text();
        console.error('[TikTok] Apify 启动失败:', errorText);
        throw new Error(`Apify Actor 启动失败: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log('[TikTok] Actor 运行 ID:', runId);

    // 轮询等待完成 (最多等待 60 秒)
    const maxWaitTime = 60000;
    const pollInterval = 2000;
    let elapsed = 0;

    while (elapsed < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        elapsed += pollInterval;

        const statusResponse = await fetch(
            `${APIFY_BASE_URL}/actor-runs/${runId}?token=${token}`
        );
        const statusData = await statusResponse.json();
        const status = statusData.data.status;

        console.log(`[TikTok] 运行状态: ${status} (${elapsed / 1000}s)`);

        if (status === 'SUCCEEDED') {
            // 获取数据集结果
            const datasetId = statusData.data.defaultDatasetId;
            const dataResponse = await fetch(
                `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${token}`
            );
            return await dataResponse.json();
        } else if (status === 'FAILED' || status === 'ABORTED') {
            throw new Error(`Actor 运行失败: ${status}`);
        }
    }

    throw new Error('Actor 运行超时');
};

/**
 * 将 Apify 返回数据转换为 TikTokProductData 格式
 */
const transformApifyData = (items: any[]): TikTokProductData[] => {
    return items.slice(0, 10).map((item, index) => ({
        productId: item.id || `TT_${Date.now()}_${index}`,
        title: item.text || item.desc || 'TikTok Video',
        price: null, // TikTok 视频数据不含价格
        originalPrice: null,
        currency: 'USD',
        salesCount: null,
        rating: null,
        reviewCount: item.commentCount || 0,
        mainImage: item.covers?.[0] || item.videoMeta?.coverUrl || `https://picsum.photos/400/400?random=${800 + index}`,
        videoViews: formatViews(item.playCount || item.videoMeta?.playCount || 0),
        shopName: item.authorMeta?.name || item.author?.nickname || 'TikTok Creator',
        shopRating: null,
        link: item.webVideoUrl || `https://www.tiktok.com/@${item.authorMeta?.name}/video/${item.id}`,
        category: item.hashtags?.[0]?.name || 'Trending',
        fetchedAt: Date.now(),
        dataSource: 'real' as const
    }));
};

/**
 * 格式化播放量
 */
const formatViews = (count: number): string => {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
        return `${(count / 1000).toFixed(0)}K views`;
    }
    return `${count} views`;
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

    // 真实 API 调用（使用 Apify）
    if (dataMode === 'real') {
        try {
            console.log('[TikTok] 使用 Apify TikTok Scraper 获取真实数据...');
            
            // Apify TikTok Scraper 输入参数
            const input = {
                searchQueries: [query],
                resultsPerPage: Math.min(limit, 20),
                shouldDownloadVideos: false,
                shouldDownloadCovers: false
            };

            const results = await runApifyActor(input);
            
            if (results && results.length > 0) {
                console.log(`[TikTok] 获取到 ${results.length} 条真实数据`);
                return transformApifyData(results).slice(0, limit);
            }
        } catch (error) {
            console.error('[TikTok] Apify API 调用失败，降级到模拟数据:', error);
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

    const dataMode = getTikTokDataSourceMode();

    // 真实 API 调用（使用 Apify）
    if (dataMode === 'real') {
        try {
            console.log('[TikTok] 使用 Apify 获取热门趋势...');
            
            // 获取热门话题/趋势
            const input = {
                hashtags: ['trending', 'viral', 'fyp'],
                resultsPerPage: 10,
                shouldDownloadVideos: false,
                shouldDownloadCovers: false
            };

            const results = await runApifyActor(input);
            
            if (results && results.length > 0) {
                console.log(`[TikTok] 获取到 ${results.length} 条热门趋势数据`);
                return transformApifyData(results);
            }
        } catch (error) {
            console.error('[TikTok] Apify 热门趋势获取失败，使用预设数据:', error);
        }
    }

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
