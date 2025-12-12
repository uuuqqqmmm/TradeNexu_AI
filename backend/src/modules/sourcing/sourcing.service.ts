/**
 * 供应链服务 (1688 货源搜索)
 * 
 * 核心功能:
 * 1. 以图搜图 - 用 Amazon 产品图在 1688 找同款
 * 2. 关键词搜索 - AI 翻译英文标题为中文搜索词
 * 3. 利润试算 - 计算采购成本和预估利润
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// 利润计算参数
interface ProfitParams {
  sellPrice: number;      // 售价 (USD)
  costPrice: number;      // 采购价 (CNY)
  weight: number;         // 重量 (kg)
  shippingPerKg?: number; // 头程运费 (CNY/kg), 默认 30
  referralFee?: number;   // 平台佣金比例, 默认 0.15
  fbaFee?: number;        // FBA 费用 (USD), 默认 5
  marketingCost?: number; // 广告费 (USD), 默认 2
  exchangeRate?: number;  // 汇率, 默认 7.2
}

@Injectable()
export class SourcingService {
  constructor(private prisma: PrismaService) {}

  /**
   * 为产品搜索 1688 货源
   * TODO: 集成真实 1688 API 或爬虫
   */
  async searchSources(productId: string, options: {
    imageUrl?: string;
    keywords?: string;
  }) {
    // 目前返回 Mock 数据，后续集成真实 API
    const mockResults = [
      {
        supplierUrl: 'https://detail.1688.com/offer/123456789.html',
        supplierName: '深圳智能科技有限公司',
        costPrice: 45.00,
        currency: 'CNY',
        moq: 100,
        supplierRating: 4.8,
        shopYears: 5,
        matchScore: 0.92,
        imageUrl: 'https://cbu01.alicdn.com/img/example.jpg',
      },
      {
        supplierUrl: 'https://detail.1688.com/offer/987654321.html',
        supplierName: '广州优品电子厂',
        costPrice: 38.50,
        currency: 'CNY',
        moq: 200,
        supplierRating: 4.5,
        shopYears: 3,
        matchScore: 0.85,
        imageUrl: 'https://cbu01.alicdn.com/img/example2.jpg',
      },
    ];

    // 保存到数据库
    const savedResults = await Promise.all(
      mockResults.map(result =>
        this.prisma.sourcingResult.create({
          data: {
            productId,
            ...result,
          },
        })
      )
    );

    return savedResults;
  }

  /**
   * 计算利润
   */
  calculateProfit(params: ProfitParams) {
    const {
      sellPrice,
      costPrice,
      weight,
      shippingPerKg = 30,
      referralFee = 0.15,
      fbaFee = 5,
      marketingCost = 2,
      exchangeRate = 7.2,
    } = params;

    // 平台费用 (USD)
    const platformFee = sellPrice * referralFee;

    // 净收入 (USD)
    const netRevenue = sellPrice - platformFee - fbaFee - marketingCost;

    // 净收入转 CNY
    const netRevenueCNY = netRevenue * exchangeRate;

    // 总成本 (CNY)
    const shippingCost = weight * shippingPerKg;
    const totalCost = costPrice + shippingCost;

    // 净利润 (CNY)
    const netProfit = netRevenueCNY - totalCost;

    // 利润率
    const profitMargin = (netProfit / (sellPrice * exchangeRate)) * 100;

    return {
      sellPrice,
      costPrice,
      shippingCost,
      platformFee: platformFee * exchangeRate,
      fbaFee: fbaFee * exchangeRate,
      marketingCost: marketingCost * exchangeRate,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
      exchangeRate,
      currency: 'CNY',
    };
  }

  /**
   * 保存利润计算结果
   */
  async saveProfitCalculation(productId: string, sourcingId: string, params: ProfitParams) {
    const result = this.calculateProfit(params);

    return this.prisma.profitCalculation.create({
      data: {
        productId,
        sourcingId,
        sellPrice: params.sellPrice,
        costPrice: params.costPrice,
        shippingCost: result.shippingCost,
        platformFee: result.platformFee,
        fbaFee: result.fbaFee,
        marketingCost: result.marketingCost,
        netProfit: result.netProfit,
        profitMargin: result.profitMargin,
        exchangeRate: params.exchangeRate || 7.2,
      },
    });
  }

  /**
   * 获取产品的货源列表
   */
  async getSourcingResults(productId: string) {
    return this.prisma.sourcingResult.findMany({
      where: { productId },
      orderBy: { matchScore: 'desc' },
    });
  }
}
