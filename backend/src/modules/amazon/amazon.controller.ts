/**
 * Amazon 数据控制器
 * 提供 Amazon 产品数据 API (通过 Apify 代理)
 */

import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AmazonService } from './amazon.service';

@ApiTags('amazon')
@Controller('amazon')
export class AmazonController {
  constructor(private amazonService: AmazonService) {}

  @Get('search')
  @ApiOperation({ summary: '搜索 Amazon 产品' })
  async searchProducts(
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
  ) {
    const products = await this.amazonService.searchProducts(keyword, limit || 10);
    // 根据实际返回的产品数据判断数据源，而不是仅检查 Token 是否存在
    const actualDataSource = products.length > 0 && products[0].dataSource === 'real' ? 'real' : 'mock';
    return {
      success: true,
      dataSource: actualDataSource,
      count: products.length,
      products,
    };
  }

  @Get('product/:asin')
  @ApiOperation({ summary: '获取产品详情' })
  async getProduct(@Param('asin') asin: string) {
    const product = await this.amazonService.getProductByAsin(asin);
    return {
      success: true,
      dataSource: this.amazonService.getDataSourceMode(),
      product,
    };
  }

  @Get('status')
  @ApiOperation({ summary: '检查数据源状态' })
  async getStatus() {
    return {
      dataSource: this.amazonService.getDataSourceMode(),
      configuredApis: this.amazonService.getConfiguredApis(),
      ready: this.amazonService.getDataSourceMode() === 'real',
    };
  }
}
