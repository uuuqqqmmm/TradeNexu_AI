/**
 * 任务队列控制器
 */

import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService, JobType } from './jobs.service';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(
    private jobsService: JobsService,
    private queueService: QueueService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建任务' })
  async createJob(@Request() req, @Body() data: { type: JobType; inputData: any }) {
    return this.jobsService.createJob(req.user.sub, data.type, data.inputData);
  }

  @Get()
  @ApiOperation({ summary: '获取任务列表' })
  async getUserJobs(
    @Request() req,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.jobsService.getUserJobs(req.user.sub, {
      status: status as any,
      type: type as any,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取任务详情' })
  async getJob(@Param('id') id: string) {
    return this.jobsService.getJob(id);
  }

  @Get('queue/stats')
  @ApiOperation({ summary: '获取队列状态' })
  async getQueueStats() {
    return this.queueService.getQueueStats();
  }

  @Post('queue/add')
  @ApiOperation({ summary: '添加任务到队列' })
  async addToQueue(
    @Request() req,
    @Body() data: { type: 'search-1688' | 'scrape-amazon' | 'monitor-price'; productId?: string; keywords?: string; imageUrl?: string },
  ) {
    // 先创建数据库记录
    const job = await this.jobsService.createJob(req.user.sub, data.type as any, data);
    
    // 添加到队列
    const queueJobId = await this.queueService.addJob(data.type, {
      jobId: job.id,
      productId: data.productId,
      keywords: data.keywords,
      imageUrl: data.imageUrl,
    });

    return {
      ...job,
      queueJobId,
      queueAvailable: this.queueService.available,
    };
  }
}
