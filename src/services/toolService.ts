import { ProductDetails } from "../types";
import { Tool } from "@google/genai";

// 模拟数据生成器
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
        },
        {
            title: "Anker Soundcore Life Q30",
            price: "$79.99",
            sales_volume: "10K+ bought in past month",
            main_image: "https://picsum.photos/400/400?random=102",
            url: "https://www.amazon.com/dp/B08HMWZBXC",
            platform: "Amazon",
            rating: 4.5,
            reviewCount: 50000,
            sentiment: {
                score: 0.7,
                keywords: ["Value for money", "Good Bass", "Plastic build"],
                summary: "Best budget option, great sound for the price but build quality is average."
            },
            priceHistory: [
                { date: "2024-09-01", price: 89.99, volume: 800 },
                { date: "2024-10-01", price: 79.99, volume: 1200 },
                { date: "2024-11-01", price: 69.99, volume: 1500 }
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

export const fetchProductDetails = async (query: string, platform: string = "Amazon"): Promise<ProductDetails[]> => {
    console.log(`[Tool] Fetching products for "${query}" on ${platform}...`);

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 简单的关键词匹配模拟
    const products = mockProducts[platform] || mockProducts["Amazon"];
    return products.map(p => ({
        ...p,
        title: `${p.title} - ${query} Edition` // 动态修改标题以显示“实时性”
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
                description: "Fetch real-time product details, price history, and sentiment from e-commerce platforms.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        query: {
                            type: "STRING",
                            description: "Search keywords or URL."
                        },
                        platform: {
                            type: "STRING",
                            description: "The platform to search on.",
                            enum: ["Amazon", "TikTok", "Alibaba", "AliExpress"]
                        }
                    },
                    required: ["query"]
                }
            },
            {
                name: "fetchCompetitors",
                description: "Find competitors for a specific product.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        productName: { type: "STRING" }
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
