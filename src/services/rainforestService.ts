/**
 * Rainforest API 服务
 * 用于获取亚马逊产品数据
 * 
 * 配置说明:
 * - 如果设置了 RAINFOREST_API_KEY，使用真实 API
 * - 否则使用模拟数据（用于开发和演示）
 */

import { AmazonProductData, AmazonResearchQuery } from '../types';

// API 配置
const RAINFOREST_BASE_URL = 'https://api.rainforestapi.com/request';

// 检查是否配置了真实 API Key
const getRainforestApiKey = (): string | null => {
    const key = import.meta.env.VITE_RAINFOREST_API_KEY;
    return key && key !== 'your_rainforest_api_key' ? key : null;
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

// ============== API 调用函数 ==============

/**
 * 根据 ASIN 获取亚马逊产品详情
 */
export async function fetchAmazonProductByAsin(
    asin: string,
    domain: string = 'amazon.com'
): Promise<AmazonProductData> {
    const apiKey = getRainforestApiKey();

    // 模拟模式
    if (!apiKey) {
        console.log(`[Rainforest] 使用模拟数据 (ASIN: ${asin})`);
        await new Promise(resolve => setTimeout(resolve, 1200)); // 模拟网络延迟

        if (mockAmazonProducts[asin]) {
            return { ...mockAmazonProducts[asin], fetchedAt: Date.now() };
        }

        // 未找到则生成一个
        return generateMockProduct(asin, 0);
    }

    // 真实 API 调用
    console.log(`[Rainforest] 调用真实 API (ASIN: ${asin}, Domain: ${domain})`);

    try {
        const params = new URLSearchParams({
            api_key: apiKey,
            type: 'product',
            amazon_domain: domain,
            asin: asin
        });

        const response = await fetch(`${RAINFOREST_BASE_URL}?${params}`);
        const data = await response.json();

        if (response.ok && data.product) {
            const product = data.product;

            // 提取 BSR 排名
            let bsr: number | null = null;
            let bsrCategory: string | null = null;
            if (product.bestsellers_rank && product.bestsellers_rank.length > 0) {
                bsr = product.bestsellers_rank[0].rank ?? null;
                bsrCategory = product.bestsellers_rank[0].category ?? null;
            }

            return {
                asin: product.asin,
                title: product.title || '未知产品',
                recentSalesLabel: product.recent_sales || null,
                bsr,
                bsrCategory,
                price: product.buybox_winner?.price?.value ?? null,
                currency: product.buybox_winner?.price?.currency ?? 'USD',
                mainImage: product.main_image?.link || '',
                link: product.link || `https://www.${domain}/dp/${asin}`,
                fetchedAt: Date.now(),
                dataSource: 'real'
            };
        } else {
            throw new Error(data.request_info?.message || '获取产品数据失败');
        }
    } catch (error) {
        console.error('[Rainforest] API 调用失败:', error);
        throw error;
    }
}

/**
 * 根据关键词搜索亚马逊产品
 */
export async function searchAmazonProducts(
    keyword: string,
    domain: string = 'amazon.com',
    maxResults: number = 5
): Promise<AmazonProductData[]> {
    const apiKey = getRainforestApiKey();

    // 模拟模式
    if (!apiKey) {
        console.log(`[Rainforest] 使用模拟数据搜索 (关键词: ${keyword})`);
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 生成模拟搜索结果
        return Array.from({ length: maxResults }, (_, i) => generateMockProduct(keyword, i));
    }

    // 真实 API 调用
    console.log(`[Rainforest] 调用真实 API 搜索 (关键词: ${keyword})`);

    try {
        const params = new URLSearchParams({
            api_key: apiKey,
            type: 'search',
            amazon_domain: domain,
            search_term: keyword
        });

        const response = await fetch(`${RAINFOREST_BASE_URL}?${params}`);
        const data = await response.json();

        if (response.ok && data.search_results) {
            return data.search_results.slice(0, maxResults).map((item: any) => ({
                asin: item.asin,
                title: item.title || '未知产品',
                recentSalesLabel: item.recent_sales || null,
                bsr: null,
                bsrCategory: null,
                price: item.price?.value ?? null,
                currency: item.price?.currency ?? 'USD',
                mainImage: item.image || '',
                link: item.link || '',
                fetchedAt: Date.now(),
                dataSource: 'real' as const
            }));
        } else {
            throw new Error(data.request_info?.message || '搜索产品失败');
        }
    } catch (error) {
        console.error('[Rainforest] 搜索 API 调用失败:', error);
        throw error;
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
    return getRainforestApiKey() ? 'real' : 'mock';
}
