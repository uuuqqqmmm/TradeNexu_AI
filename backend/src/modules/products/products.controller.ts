/**
 * 产品管理控制器
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: '创建产品' })
  async create(@Request() req, @Body() data: any) {
    return this.productsService.create(req.user.sub, data);
  }

  @Get()
  @ApiOperation({ summary: '获取产品列表' })
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('platform') platform?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.findAll(req.user.sub, { status, platform, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取产品详情' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.productsService.findOne(id, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新产品' })
  async update(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.productsService.update(id, req.user.sub, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除产品' })
  async delete(@Request() req, @Param('id') id: string) {
    return this.productsService.delete(id, req.user.sub);
  }
}
