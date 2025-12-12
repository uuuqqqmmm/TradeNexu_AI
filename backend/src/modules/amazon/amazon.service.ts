/**
 * Amazon 数据服务
 * 支持多个数据源：RapidAPI、Apify
 * 解决前端 CORS 问题，由后端代理调用
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// RapidAPI 配置 - Real-Time Amazon Data API
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}`;

// Apify API 配置 - 使用 jupri/amazon-explorer (按使用量付费，支持搜索)
const APIFY_BASE_URL = 'https://api.apify.com/v2';
const AMAZON_SCRAPER_ACTOR_ID = 'jupri~amazon-explorer'; // 按使用量付费

export interface AmazonProduct {
  asin: string;
  title: string;
  price: number | null;
  currency: string;
  mainImage: string;
  link: string;
  rating: number | null;
  reviewCount: number;
  recentSalesLabel: string | null;
  bsr: number | null;
  bsrCategory: string | null;
  dataSource: 'real' | 'mock';
  fetchedAt: number;
}

@Injectable()
export class AmazonService {
  private readonly logger = new Logger(AmazonService.name);

  constructor(private config: ConfigService) {}

  /**
   * 获取 RapidAPI Key
   */
  private getRapidApiKey(): string | null {
    const key = this.config.get<string>('RAPIDAPI_KEY') ||
                this.config.get<string>('VITE_RAPIDAPI_KEY') ||
                process.env.RAPIDAPI_KEY ||
                process.env.VITE_RAPIDAPI_KEY;
    if (key) {
      this.logger.debug(`[RapidAPI] Key 前10位: ${key.substring(0, 10)}...`);
    }
    return key && key !== 'your_rapidapi_key_here' ? key : null;
  }

  /**
   * 获取 Apify Token
   */
  private getApifyToken(): string | null {
    const token = this.config.get<string>('APIFY_TOKEN') || 
                  this.config.get<string>('VITE_APIFY_TOKEN') ||
                  process.env.APIFY_TOKEN ||
                  process.env.VITE_APIFY_TOKEN;
    return token && token !== 'your_apify_token_here' ? token : null;
  }

  /**
   * 运行 Apify Actor
   */
  private async runApifyActor(input: Record<string, any>): Promise<any[]> {
    const token = this.getApifyToken();
    if (!token) {
      throw new Error('Apify Token 未配置');
    }

    this.logger.log(`启动 Apify Actor: ${AMAZON_SCRAPER_ACTOR_ID}`);

    // 启动 Actor
    const runResponse = await fetch(
      `${APIFY_BASE_URL}/acts/${AMAZON_SCRAPER_ACTOR_ID}/runs?token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`启动 Actor 失败: ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data?.id;
    this.logger.log(`Actor 运行 ID: ${runId}`);

    if (!runId) {
      throw new Error('无法获取运行 ID');
    }

    // 轮询等待完成
    const maxWaitTime = 120000;
    const pollInterval = 3000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const statusResponse = await fetch(
        `${APIFY_BASE_URL}/actor-runs/${runId}?token=${token}`
      );
      const statusData = await statusResponse.json();
      const status = statusData.data?.status;

      this.logger.debug(`Actor 状态: ${status}`);

      if (status === 'SUCCEEDED') {
        const datasetId = statusData.data?.defaultDatasetId;
        if (datasetId) {
          const dataResponse = await fetch(
            `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${token}`
          );
          return await dataResponse.json();
        }
        return [];
      }

      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`Actor 运行失败: ${status}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Actor 运行超时');
  }

  /**
   * 转换 Apify 数据格式
   */
  private transformApifyData(items: any[]): AmazonProduct[] {
    return items.map((item, index) => {
      let price: number | null = null;
      if (item.price) {
        const priceStr = String(item.price).replace(/[^0-9.]/g, '');
        price = parseFloat(priceStr) || null;
      }

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
        price,
        currency: 'USD',
        mainImage: item.thumbnailImage || item.image || `https://picsum.photos/400/400?random=${400 + index}`,
        link: item.url || `https://www.amazon.com/dp/${item.asin}`,
        rating: item.stars || null,
        reviewCount: item.reviewsCount || 0,
        recentSalesLabel,
        bsr: item.reviewsCount ? Math.max(1, Math.floor(100 - (item.reviewsCount / 1000))) : null,
        bsrCategory: item.breadCrumbs || (Array.isArray(item.categories) ? item.categories.join(' > ') : item.categories) || null,
        dataSource: 'real' as const,
        fetchedAt: Date.now(),
      };
    });
  }

  /**
   * 生成 Mock 产品数据
   */
  private generateMockProduct(keyword: string, index: number): AmazonProduct {
    const mockTitles = [
      `${keyword} 专业版 - 热销款式 #${index + 1}`,
      `${keyword} 升级版 - 品质保证 #${index + 1}`,
      `${keyword} 高端款 - 跨境爆款 #${index + 1}`,
    ];

    return {
      asin: `MOCK${String(index).padStart(6, '0')}`,
      title: mockTitles[index % mockTitles.length],
      price: 29.99 + index * 10,
      currency: 'USD',
      mainImage: `https://picsum.photos/400/400?random=${100 + index}`,
      link: `https://www.amazon.com/dp/MOCK${String(index).padStart(6, '0')}`,
      rating: 4.0 + (index % 10) / 10,
      reviewCount: 1000 + index * 500,
      recentSalesLabel: index < 3 ? '1K+ bought in past month' : '100+ bought in past month',
      bsr: 50 + index * 10,
      bsrCategory: 'Electronics',
      dataSource: 'mock' as const,
      fetchedAt: Date.now(),
    };
  }

  /**
   * 通过 RapidAPI (Real-Time Amazon Data) 搜索产品
   */
  private async searchViaRapidApi(keyword: string, maxResults: number): Promise<AmazonProduct[] | null> {
    const apiKey = this.getRapidApiKey();
    if (!apiKey) return null;

    this.logger.log(`[RapidAPI] 搜索产品: ${keyword}`);

    try {
      // Real-Time Amazon Data API 搜索端点 (按官方文档格式)
      const url = `${RAPIDAPI_BASE_URL}/search?query=${encodeURIComponent(keyword)}&page=1&country=US&sort_by=RELEVANCE&product_condition=ALL&is_prime=false&deals_and_discounts=NONE`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[RapidAPI] 请求失败: ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json();
      this.logger.log(`[RapidAPI] 响应状态: ${data.status}`);
      
      // Real-Time Amazon Data API 格式: { status: "OK", data: { products: [...] } }
      const products = data.data?.products || data.data?.results || [];
      this.logger.log(`[RapidAPI] 返回 ${products.length} 条数据`);

      if (products.length > 0) {
        return products.slice(0, maxResults).map((item: any, index: number) => {
          // 解析价格
          let price: number | null = null;
          if (item.product_price) {
            const priceMatch = item.product_price.match(/[\d.]+/);
            price = priceMatch ? parseFloat(priceMatch[0]) : null;
          } else if (item.price?.current_price) {
            price = item.price.current_price;
          }

          const asin = item.asin || `RAPID_${index}`;

          return {
            asin,
            title: item.product_title || item.title || '未知产品',
            price,
            currency: 'USD',
            mainImage: item.product_photo || item.product_image || item.thumbnail || `https://picsum.photos/400/400?random=${500 + index}`,
            link: item.product_url || `https://www.amazon.com/dp/${asin}`,
            rating: item.product_star_rating ? parseFloat(item.product_star_rating) : null,
            reviewCount: item.product_num_ratings || item.product_num_reviews || 0,
            recentSalesLabel: item.sales_volume || (item.product_num_ratings > 1000 ? '1K+ bought in past month' : null),
            bsr: null,
            bsrCategory: item.category || null,
            dataSource: 'real' as const,
            fetchedAt: Date.now(),
          };
        });
      }

      return null;
    } catch (error) {
      this.logger.error('[RapidAPI] 搜索失败:', error);
      return null;
    }
  }

  /**
   * 搜索 Amazon 产品 - 优先使用 RapidAPI，备用 Apify
   */
  async searchProducts(keyword: string, maxResults: number = 10): Promise<AmazonProduct[]> {
    this.logger.log(`搜索 Amazon 产品: ${keyword}`);

    // 1. 优先尝试 RapidAPI
    const rapidApiResults = await this.searchViaRapidApi(keyword, maxResults);
    if (rapidApiResults && rapidApiResults.length > 0) {
      return rapidApiResults;
    }

    // 2. 备用：Apify 官方 amazon-scraper (按计算资源付费)
    const apifyToken = this.getApifyToken();
    if (apifyToken) {
      try {
        // jupri/amazon-explorer: 支持关键词搜索
        const input = {
          keyword: keyword,
          maxResults: Math.min(maxResults, 5), // 限制数量节省额度
          country: 'US',
        };
        const items = await this.runApifyActor(input);

        if (items.length > 0) {
          const transformed = this.transformApifyData(items);
          return transformed.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)).slice(0, maxResults);
        }
      } catch (error) {
        this.logger.error('Apify 搜索失败:', error);
      }
    }

    // 3. 降级到模拟数据
    this.logger.warn(`使用模拟数据 (关键词: ${keyword})`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return Array.from({ length: maxResults }, (_, i) => this.generateMockProduct(keyword, i));
  }

  /**
   * 获取产品详情
   */
  async getProductByAsin(asin: string): Promise<AmazonProduct> {
    const token = this.getApifyToken();

    if (!token) {
      this.logger.warn(`使用模拟数据 (ASIN: ${asin})`);
      return this.generateMockProduct(asin, 0);
    }

    this.logger.log(`获取产品详情: ${asin}`);

    try {
      // epctex/amazon-scraper 使用 startUrls 参数获取产品详情
      const input = {
        startUrls: [`https://www.amazon.com/dp/${asin}`],
        maxItems: 1,
        proxy: {
          useApifyProxy: true,
        },
      };

      const items = await this.runApifyActor(input);

      if (items.length > 0) {
        return this.transformApifyData(items)[0];
      }

      return this.generateMockProduct(asin, 0);
    } catch (error) {
      this.logger.error('获取详情失败:', error);
      return this.generateMockProduct(asin, 0);
    }
  }

  /**
   * 检查数据源模式
   */
  getDataSourceMode(): 'real' | 'mock' {
    // 优先检查 RapidAPI，其次 Apify
    return (this.getRapidApiKey() || this.getApifyToken()) ? 'real' : 'mock';
  }

  /**
   * 获取当前配置的 API 来源
   */
  getConfiguredApis(): string[] {
    const apis: string[] = [];
    if (this.getRapidApiKey()) apis.push('RapidAPI');
    if (this.getApifyToken()) apis.push('Apify');
    return apis;
  }
}
