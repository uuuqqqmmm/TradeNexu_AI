/**
 * 供应链控制器
 */

import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SourcingService } from './sourcing.service';
import { Alibaba1688Service } from './alibaba1688.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('sourcing')
@Controller('sourcing')
export class SourcingController {
  constructor(
    private sourcingService: SourcingService,
    private alibaba1688Service: Alibaba1688Service,
  ) {}

  // ============== 公开 API (无需认证) ==============

  @Get('1688/search')
  @ApiOperation({ summary: '搜索 1688 货源 (公开)' })
  async search1688(
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: 'price' | 'sales' | 'rating',
  ) {
    return this.alibaba1688Service.searchByKeyword({
      keyword,
      limit: limit || 10,
      sortBy: sortBy || 'rating',
    });
  }

  @Get('1688/translate')
  @ApiOperation({ summary: '翻译关键词为中文' })
  async translateKeyword(@Query('keyword') keyword: string) {
    const translations = await this.alibaba1688Service.translateKeyword(keyword);
    return { original: keyword, translations };
  }

  @Post('1688/profit')
  @ApiOperation({ summary: '快速利润计算' })
  async quickProfitCalc(@Body() data: {
    sourcingPrice: number;
    sellingPrice: number;
    shippingCost?: number;
    platformFee?: number;
    exchangeRate?: number;
  }) {
    return this.alibaba1688Service.calculateProfitMargin(
      data.sourcingPrice,
      data.sellingPrice,
      data.shippingCost,
      data.platformFee,
      data.exchangeRate,
    );
  }

  // ============== 需要认证的 API ==============

  @Post('search/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '搜索 1688 货源 (需认证)' })
  async searchSources(
    @Param('productId') productId: string,
    @Body() data: { imageUrl?: string; keywords?: string },
  ) {
    return this.sourcingService.searchSources(productId, data);
  }

  @Get('results/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取产品货源列表' })
  async getSourcingResults(@Param('productId') productId: string) {
    return this.sourcingService.getSourcingResults(productId);
  }

  @Post('profit/calculate')
  @ApiOperation({ summary: '计算利润 (公开)' })
  async calculateProfit(@Body() params: {
    sellPrice: number;
    costPrice: number;
    weight: number;
    shippingPerKg?: number;
    referralFee?: number;
    fbaFee?: number;
    marketingCost?: number;
    exchangeRate?: number;
  }) {
    return this.sourcingService.calculateProfit(params);
  }

  @Post('profit/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '保存利润计算结果' })
  async saveProfitCalculation(@Body() data: {
    productId: string;
    sourcingId: string;
    sellPrice: number;
    costPrice: number;
    weight: number;
  }) {
    return this.sourcingService.saveProfitCalculation(
      data.productId,
      data.sourcingId,
      data,
    );
  }
}
