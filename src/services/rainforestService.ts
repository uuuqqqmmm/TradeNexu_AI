/**
 * Amazon 数据服务 (Apify Amazon Scraper)
 * 用于获取亚马逊产品数据
 * 
 * 配置说明:
 * - 使用 Apify Amazon Scraper Actor
 * - 需要配置 VITE_APIFY_TOKEN
 */

import { AmazonProductData, AmazonResearchQuery } from '../types';

// Apify API 配置
const APIFY_BASE_URL = 'https://api.apify.com/v2';
const AMAZON_SCRAPER_ACTOR_ID = 'junglee~amazon-scraper'; // Apify Amazon Scraper Actor

// 获取 Apify Token
const getApifyToken = (): string | null => {
    const token = import.meta.env.VITE_APIFY_TOKEN;
    return token && token !== 'your_apify_token_here' ? token : null;
};

// ============== 模拟数据 ==============
const mockAmazonProducts: Record<string, AmazonProductData> = {
    'B08F6Z8666': {
        asin: 'B08F6Z8666',
        title: 'Sony WH-1000XM4 无线降噪耳机',
        recentSalesLabel: '2K+ bought in past month',
        bsr: 15,
        bsrCategory: 'Electronics > Headphones',
        price: 278.00,
        currency: 'USD',
        mainImage: 'https://picsum.photos/400/400?random=201',
        link: 'https://www.amazon.com/dp/B08F6Z8666',
        fetchedAt: Date.now(),
        dataSource: 'mock'
    },
    'B09XS7JWHH': {
        asin: 'B09XS7JWHH',
        title: 'Sony WH-1000XM5 无线降噪耳机 (新款)',
        recentSalesLabel: '5K+ bought in past month',
        bsr: 8,
        bsrCategory: 'Electronics > Headphones',
        price: 348.00,
        currency: 'USD',
        mainImage: 'https://picsum.photos/400/400?random=202',
        link: 'https://www.amazon.com/dp/B09XS7JWHH',
        fetchedAt: Date.now(),
        dataSource: 'mock'
    },
    'B07XYZ1234': {
        asin: 'B07XYZ1234',
        title: '智能宠物喂食器 Pro - 自动定时投食',
        recentSalesLabel: '1K+ bought in past month',
        bsr: 42,
        bsrCategory: 'Pet Supplies > Automatic Feeders',
        price: 89.99,
        currency: 'USD',
        mainImage: 'https://picsum.photos/400/400?random=203',
        link: 'https://www.amazon.com/dp/B07XYZ1234',
        fetchedAt: Date.now(),
        dataSource: 'mock'
    }
};

// 通用模拟产品生成器（用于搜索关键词）
const generateMockProduct = (query: string, index: number): AmazonProductData => ({
    asin: `B0${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    title: `${query} - 热销款式 #${index + 1}`,
    recentSalesLabel: `${Math.floor(Math.random() * 5) + 1}K+ bought in past month`,
    bsr: Math.floor(Math.random() * 100) + 1,
    bsrCategory: 'Various Categories',
    price: Math.floor(Math.random() * 200) + 20,
    currency: 'USD',
    mainImage: `https://picsum.photos/400/400?random=${300 + index}`,
    link: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
    fetchedAt: Date.now(),
    dataSource: 'mock'
});

// ============== Apify Actor 执行函数 ==============

/**
 * 运行 Apify Amazon Scraper Actor 并获取结果
 */
const runApifyAmazonActor = async (input: Record<string, any>): Promise<any[]> => {
    const token = getApifyToken();
    if (!token) {
        throw new Error('Apify Token 未配置');
    }

    console.log('[Apify Amazon] 启动 Actor，输入:', JSON.stringify(input));

    // 1. 启动 Actor 运行
    const runResponse = await fetch(
        `${APIFY_BASE_URL}/acts/${AMAZON_SCRAPER_ACTOR_ID}/runs?token=${token}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        }
    );

    if (!runResponse.ok) {
        const errorText = await runResponse.text();
        throw new Error(`启动 Actor 失败: ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data?.id;
    console.log('[Apify Amazon] Actor 运行 ID:', runId);

    if (!runId) {
        throw new Error('无法获取运行 ID');
    }

    // 2. 轮询等待运行完成 (最多等待 120 秒)
    const maxWaitTime = 120000;
    const pollInterval = 3000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
        const statusResponse = await fetch(
            `${APIFY_BASE_URL}/actor-runs/${runId}?token=${token}`
        );
        const statusData = await statusResponse.json();
        const status = statusData.data?.status;

        console.log(`[Apify Amazon] 运行状态: ${status}`);

        if (status === 'SUCCEEDED') {
            // 3. 获取数据集结果
            const datasetId = statusData.data?.defaultDatasetId;
            if (!datasetId) {
                throw new Error('无法获取数据集 ID');
            }

            const itemsResponse = await fetch(
                `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${token}`
            );
            const items = await itemsResponse.json();
            console.log(`[Apify Amazon] 获取到 ${items.length} 条数据`);
            return items;
        }

        if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
            throw new Error(`Actor 运行失败: ${status}`);
        }

        // 等待后继续轮询
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Actor 运行超时');
};

/**
 * 转换 Apify 数据为 AmazonProductData 格式
 */
const transformApifyAmazonData = (items: any[]): AmazonProductData[] => {
    return items.map((item, index) => {
        // 解析价格
        let price: number | null = null;
        if (item.price) {
            // 价格可能是 "$29.99" 或 "29.99" 或数字
            const priceStr = String(item.price).replace(/[^0-9.]/g, '');
            price = parseFloat(priceStr) || null;
        }

        // 解析 BSR
        let bsr: number | null = null;
        let bsrCategory: string | null = null;
        if (item.reviewsCount) {
            // 使用评论数作为热度参考
            bsr = Math.max(1, Math.floor(100 - (item.reviewsCount / 1000)));
        }
        if (item.breadCrumbs || item.categories) {
            bsrCategory = item.breadCrumbs || (Array.isArray(item.categories) ? item.categories.join(' > ') : item.categories);
        }

        // 构建销量标签
        let recentSalesLabel: string | null = null;
        if (item.reviewsCount) {
            if (item.reviewsCount > 10000) {
                recentSalesLabel = '10K+ bought in past month';
            } else if (item.reviewsCount > 5000) {
                recentSalesLabel = '5K+ bought in past month';
            } else if (item.reviewsCount > 1000) {
                recentSalesLabel = '1K+ bought in past month';
            } else if (item.reviewsCount > 100) {
                recentSalesLabel = '100+ bought in past month';
            }
        }

        return {
            asin: item.asin || `APIFY_${index}`,
            title: item.title || '未知产品',
            recentSalesLabel,
            bsr,
            bsrCategory,
            price,
            currency: 'USD',
            mainImage: item.thumbnailImage || item.image || `https://picsum.photos/400/400?random=${400 + index}`,
            link: item.url || `https://www.amazon.com/dp/${item.asin}`,
            fetchedAt: Date.now(),
            dataSource: 'real',
            // 额外字段
            rating: item.stars || null,
            reviewCount: item.reviewsCount || 0,
            brand: item.brand || null,
            description: item.description || null
        };
    });
};

// ============== API 调用函数 ==============

/**
 * 根据 ASIN 获取亚马逊产品详情
 */
export async function fetchAmazonProductByAsin(
    asin: string,
    domain: string = 'amazon.com'
): Promise<AmazonProductData> {
    const token = getApifyToken();

    // 模拟模式
    if (!token) {
        console.log(`[Amazon] 使用模拟数据 (ASIN: ${asin})`);
        await new Promise(resolve => setTimeout(resolve, 1200));

        if (mockAmazonProducts[asin]) {
            return { ...mockAmazonProducts[asin], fetchedAt: Date.now() };
        }

        return generateMockProduct(asin, 0);
    }

    // 使用 Apify Amazon Scraper
    console.log(`[Apify Amazon] 获取产品详情 (ASIN: ${asin})`);

    try {
        const input = {
            categoryOrProductUrls: [{ url: `https://www.${domain}/dp/${asin}` }],
            maxItemsPerStartUrl: 1,
            proxyCountry: 'AUTO'
        };

        const items = await runApifyAmazonActor(input);
        
        if (items.length > 0) {
            const transformed = transformApifyAmazonData(items);
            return transformed[0];
        }

        throw new Error('未找到产品数据');
    } catch (error) {
        console.error('[Apify Amazon] API 调用失败:', error);
        // 降级到模拟数据
        console.log('[Apify Amazon] 降级到模拟数据');
        if (mockAmazonProducts[asin]) {
            return { ...mockAmazonProducts[asin], fetchedAt: Date.now() };
        }
        return generateMockProduct(asin, 0);
    }
}

/**
 * 根据关键词搜索亚马逊产品
 */
export async function searchAmazonProducts(
    keyword: string,
    domain: string = 'amazon.com',
    maxResults: number = 10
): Promise<AmazonProductData[]> {
    const token = getApifyToken();

    // 模拟模式
    if (!token) {
        console.log(`[Amazon] 使用模拟数据搜索 (关键词: ${keyword})`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return Array.from({ length: maxResults }, (_, i) => generateMockProduct(keyword, i));
    }

    // 使用 Apify Amazon Scraper
    console.log(`[Apify Amazon] 搜索产品 (关键词: ${keyword})`);

    try {
        // 构建搜索 URL
        const searchUrl = `https://www.${domain}/s?k=${encodeURIComponent(keyword)}`;
        
        const input = {
            categoryOrProductUrls: [{ url: searchUrl }],
            maxItemsPerStartUrl: maxResults,
            proxyCountry: 'AUTO'
        };

        const items = await runApifyAmazonActor(input);
        
        if (items.length > 0) {
            const transformed = transformApifyAmazonData(items);
            // 按评论数排序（作为热度指标）
            return transformed.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)).slice(0, maxResults);
        }

        console.log('[Apify Amazon] 未获取到数据，使用模拟数据');
        return Array.from({ length: maxResults }, (_, i) => generateMockProduct(keyword, i));
    } catch (error) {
        console.error('[Apify Amazon] 搜索失败:', error);
        // 降级到模拟数据
        console.log('[Apify Amazon] 降级到模拟数据');
        return Array.from({ length: maxResults }, (_, i) => generateMockProduct(keyword, i));
    }
}

/**
 * 统一查询入口
 */
export async function queryAmazonData(query: AmazonResearchQuery): Promise<AmazonProductData[]> {
    const { type, value, domain } = query;

    switch (type) {
        case 'asin':
            const product = await fetchAmazonProductByAsin(value, domain);
            return [product];

        case 'keyword':
            return await searchAmazonProducts(value, domain);

        case 'url':
            // 从 URL 中提取 ASIN
            const asinMatch = value.match(/\/dp\/([A-Z0-9]{10})/i) || value.match(/\/gp\/product\/([A-Z0-9]{10})/i);
            if (asinMatch) {
                const productFromUrl = await fetchAmazonProductByAsin(asinMatch[1], domain);
                return [productFromUrl];
            }
            throw new Error('无法从 URL 中提取 ASIN');

        default:
            throw new Error('不支持的查询类型');
    }
}

/**
 * 检测当前数据源模式
 */
export function getDataSourceMode(): 'real' | 'mock' {
    return getApifyToken() ? 'real' : 'mock';
}
