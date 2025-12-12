/**
 * 产品管理服务
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    platform: string;
    platformId: string;
    title: string;
    imageUrl?: string;
    sellPrice?: number;
    currency?: string;
    category?: string;
  }) {
    return this.prisma.product.create({
      data: {
        userId,
        platform: data.platform,
        platformId: data.platformId,
        title: data.title,
        imageUrl: data.imageUrl,
        sellPrice: data.sellPrice,
        currency: data.currency || 'USD',
        category: data.category,
      },
    });
  }

  async findAll(userId: string, options?: {
    status?: string;
    platform?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, platform, page = 1, limit = 20 } = options || {};

    const where: any = { userId };
    if (status) where.status = status;
    if (platform) where.platform = platform;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sourcingResults: true,
          profitCalculations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    return this.prisma.product.findFirst({
      where: { id, userId },
      include: {
        sourcingResults: true,
        profitCalculations: true,
        complianceChecks: true,
      },
    });
  }

  async update(id: string, userId: string, data: Partial<{
    title: string;
    status: string;
    aiAnalysis: any;
  }>) {
    return this.prisma.product.updateMany({
      where: { id, userId },
      data,
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.product.deleteMany({
      where: { id, userId },
    });
  }

  async updateStatus(id: string, userId: string, status: string) {
    return this.prisma.product.updateMany({
      where: { id, userId },
      data: { status },
    });
  }
}
