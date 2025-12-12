/**
 * 合规检查服务
 * 
 * 核心功能:
 * 1. HS 编码智能匹配
 * 2. 市场准入检查 (FDA/CE/CPC 等)
 * 3. 风险评估
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// 常见认证要求映射
const CERTIFICATION_RULES: Record<string, Record<string, string[]>> = {
  US: {
    electronics: ['FCC'],
    toys: ['CPC', 'CPSIA'],
    food: ['FDA'],
    cosmetics: ['FDA'],
    medical: ['FDA', '510K'],
  },
  EU: {
    electronics: ['CE', 'WEEE'],
    toys: ['CE', 'EN71'],
    food: ['EU Food Safety'],
    cosmetics: ['CPNP'],
    general: ['EPR'],
  },
  SEA: {
    food: ['Halal'],
    cosmetics: ['BPOM', 'Halal'],
  },
};

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}

  /**
   * 检查产品合规性
   */
  async checkCompliance(productId: string, market: string, category: string) {
    // 获取认证要求
    const certifications = this.getCertificationRequirements(market, category);
    
    // 评估风险等级
    const riskLevel = this.assessRiskLevel(market, category, certifications);

    // 生成 AI 建议 (TODO: 集成 Gemini RAG)
    const aiNotes = this.generateComplianceNotes(market, category, certifications);

    // 保存检查结果
    const result = await this.prisma.complianceCheck.create({
      data: {
        productId,
        market,
        certificationsRequired: certifications,
        riskLevel,
        aiNotes,
      },
    });

    return result;
  }

  /**
   * 获取认证要求
   */
  private getCertificationRequirements(market: string, category: string): string[] {
    const marketRules = CERTIFICATION_RULES[market] || {};
    const categoryRules = marketRules[category.toLowerCase()] || [];
    const generalRules = marketRules['general'] || [];
    
    return [...new Set([...categoryRules, ...generalRules])];
  }

  /**
   * 评估风险等级
   */
  private assessRiskLevel(market: string, category: string, certifications: string[]): string {
    // 高风险类目
    const highRiskCategories = ['food', 'medical', 'toys', 'cosmetics'];
    const highRiskMarkets = ['US', 'EU'];

    if (highRiskCategories.includes(category.toLowerCase()) && highRiskMarkets.includes(market)) {
      return 'high';
    }

    if (certifications.length > 2) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 生成合规建议
   */
  private generateComplianceNotes(market: string, category: string, certifications: string[]): string {
    const notes: string[] = [];

    if (market === 'US') {
      if (certifications.includes('FDA')) {
        notes.push('需要 FDA 注册，建议提前 3-6 个月准备');
      }
      if (certifications.includes('CPC')) {
        notes.push('儿童产品需要 CPC 证书和第三方检测报告');
      }
    }

    if (market === 'EU') {
      if (certifications.includes('CE')) {
        notes.push('CE 认证是强制性要求，需要准备技术文档');
      }
      if (certifications.includes('EPR')) {
        notes.push('EPR 包装法要求在德国/法国等国注册');
      }
    }

    if (market === 'SEA') {
      if (certifications.includes('Halal')) {
        notes.push('印尼/马来西亚市场建议获取清真认证');
      }
    }

    return notes.join('\n') || '暂无特殊合规要求';
  }

  /**
   * 匹配 HS 编码
   * TODO: 集成 RAG 知识库实现智能匹配
   */
  async matchHsCode(productDescription: string, market: string) {
    // Mock 实现，后续集成向量搜索
    return {
      hsCode: '8471.30.0100',
      description: '便携式自动数据处理设备',
      taxRate: 0,
      notes: '大多数电子产品进口美国免关税',
    };
  }

  /**
   * 获取产品的合规检查记录
   */
  async getComplianceChecks(productId: string) {
    return this.prisma.complianceCheck.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
