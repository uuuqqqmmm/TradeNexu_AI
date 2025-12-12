/**
 * 任务队列服务
 * 
 * 核心功能:
 * 1. 创建后台任务
 * 2. 查询任务状态
 * 3. 任务进度更新
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type JobType = 'AMAZON_SEARCH' | '1688_FIND' | 'PROFIT_CALC' | 'COMPLIANCE_CHECK' | 'AI_ANALYSIS';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建任务
   */
  async createJob(userId: string, type: JobType, inputData: any) {
    return this.prisma.job.create({
      data: {
        userId,
        type,
        inputData,
        status: 'pending',
        progress: 0,
      },
    });
  }

  /**
   * 更新任务状态
   */
  async updateJobStatus(jobId: string, status: JobStatus, data?: {
    progress?: number;
    outputData?: any;
    errorMessage?: string;
  }) {
    const updateData: any = { status };

    if (data?.progress !== undefined) updateData.progress = data.progress;
    if (data?.outputData) updateData.outputData = data.outputData;
    if (data?.errorMessage) updateData.errorMessage = data.errorMessage;

    if (status === 'running' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
      if (status === 'completed') updateData.progress = 100;
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });
  }

  /**
   * 获取任务详情
   */
  async getJob(jobId: string) {
    return this.prisma.job.findUnique({
      where: { id: jobId },
    });
  }

  /**
   * 获取用户任务列表
   */
  async getUserJobs(userId: string, options?: {
    status?: JobStatus;
    type?: JobType;
    page?: number;
    limit?: number;
  }) {
    const { status, type, page = 1, limit = 20 } = options || {};

    const where: any = { userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取待处理任务 (供 Worker 使用)
   */
  async getPendingJobs(type?: JobType, limit = 10) {
    const where: any = { status: 'pending' };
    if (type) where.type = type;

    return this.prisma.job.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }
}
