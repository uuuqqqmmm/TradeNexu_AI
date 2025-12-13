import { ProductDetails } from "../types";
import { Tool, Type } from "@google/genai";
import { searchAmazonProducts, getDataSourceMode } from "./amazonDataService";

// 模拟数据生成器（用于非 Amazon 平台的回退）
const mockProducts: Record<string, ProductDetails[]> = {
    "Amazon": [
        {
            title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
            price: "$348.00",
            sales_volume: "5K+ bought in past month",
            main_image: "https://picsum.photos/400/400?random=101",
            url: "https://www.amazon.com/dp/B09XS7JWHH",
            platform: "Amazon",
            rating: 4.6,
            reviewCount: 12500,
            sentiment: {
                score: 0.85,
                keywords: ["Excellent NC", "Comfortable", "Expensive", "Great Sound"],
                summary: "Users love the noise cancellation and sound quality, but some find the price high."
            },
            priceHistory: [
                { date: "2024-09-01", price: 399.99, volume: 100 },
                { date: "2024-10-01", price: 348.00, volume: 300 },
                { date: "2024-11-01", price: 348.00, volume: 450 }
            ],
            competitors: [
                { name: "Bose QuietComfort 45", price: "$279.00", advantage: "Better Comfort", disadvantage: "Less Battery" },
                { name: "Apple AirPods Max", price: "$549.00", advantage: "Ecosystem", disadvantage: "Heavy" }
            ]
        }
    ],
    "TikTok": [
        {
            title: "Viral Sunset Lamp Projection",
            price: "$15.00",
            sales_volume: "1.2M views",
            main_image: "https://picsum.photos/400/400?random=103",
            url: "https://shop.tiktok.com/view/product/123456",
            platform: "TikTok",
            rating: 4.2,
            reviewCount: 300,
            sentiment: {
                score: 0.6,
                keywords: ["Aesthetic", "Vibe", "Cheap material"],
                summary: "Very popular for videos, creates great atmosphere, but feels flimsy."
            }
        }
    ]
};

/**
 * 获取产品详情 - Amazon 平台使用 RapidAPI/Apify
 */
export const fetchProductDetails = async (query: string, platform: string = "Amazon"): Promise<ProductDetails[]> => {
    const dataMode = getDataSourceMode();
    console.log(`[Tool] 获取产品数据 "${query}" 平台: ${platform}，数据模式: ${dataMode}`);

    // Amazon 平台：调用 Amazon Data API
    if (platform === "Amazon") {
        try {
            const amazonProducts = await searchAmazonProducts(query, "amazon.com", 5);

            // 按销量排序（解析 recentSalesLabel 中的数字）
            const sortedProducts = amazonProducts.sort((a, b) => {
                const getVolume = (label: string | null) => {
                    if (!label) return 0;
                    const match = label.match(/(\d+)K?\+?/i);
                    return match ? parseInt(match[1]) * (label.includes('K') ? 1000 : 1) : 0;
                };
                return getVolume(b.recentSalesLabel) - getVolume(a.recentSalesLabel);
            });

            // 转换为 ProductDetails 格式
            return sortedProducts.map((p, index) => ({
                title: p.title,
                price: p.price ? `$${p.price.toFixed(2)}` : "价格未知",
                sales_volume: p.recentSalesLabel || "销量未知",
                main_image: p.mainImage,
                url: p.link,
                platform: "Amazon",
                rating: 0,  // 搜索接口不返回评分
                reviewCount: 0,
                bsr: p.bsr,
                bsrCategory: p.bsrCategory,
                dataSource: p.dataSource,
                rankInResults: index + 1  // 在结果中的排名
            }));
        } catch (error) {
            console.error("[Tool] Amazon API 调用失败，使用模拟数据:", error);
        }
    }

    // 其他平台或 API 失败时使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 500));
    const products = mockProducts[platform] || mockProducts["Amazon"];
    return products.map((p, index) => ({
        ...p,
        title: `${p.title} - ${query}`,
        dataSource: 'mock' as const,
        rankInResults: index + 1
    }));
};

export const fetchCompetitors = async (productName: string): Promise<any[]> => {
    console.log(`[Tool] Fetching competitors for "${productName}"...`);
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
        { name: "Competitor A", price: "10% lower", similarity: "High" },
        { name: "Competitor B", price: "Same", similarity: "Medium" }
    ];
};

export const fetchProductReviews = async (productId: string): Promise<any> => {
    console.log(`[Tool] Fetching reviews for "${productId}"...`);
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
        averageRating: 4.5,
        totalReviews: 1200,
        recentComments: ["Great!", "Not bad", "Fast shipping"]
    };
};

// Gemini 工具定义

export const marketIntelligenceTools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "fetchProductDetails",
                description: "搜索电商平台的产品信息，获取价格、销量、BSR排名等实时数据。当用户询问产品、市场趋势、爆款时必须调用此工具。",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        query: {
                            type: Type.STRING,
                            description: "搜索关键词，如 'wireless earbuds'、'宠物用品'、'micro SD card'",
                        },
                        platform: {
                            type: Type.STRING,
                            description: "电商平台名称",
                            enum: ["Amazon", "TikTok", "Alibaba", "AliExpress"]
                        }
                    },
                    required: ["query"]
                }
            },
            {
                name: "fetchCompetitors",
                description: "查找特定产品的竞争对手信息",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        productName: {
                            type: Type.STRING,
                            description: "产品名称"
                        }
                    },
                    required: ["productName"]
                }
            }
        ]
    }
];

// 工具执行映射
export const toolsMap = {
    fetchProductDetails: fetchProductDetails,
    fetchCompetitors: fetchCompetitors,
    fetchProductReviews: fetchProductReviews
};
