/**
 * BullMQ 队列服务
 * 版本: v3.0
 * 
 * 管理后台任务队列:
 * - 1688 搜索任务
 * - Amazon 数据抓取
 * - 价格监控
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

// 任务类型
export type CrawlerJobType = 'search-1688' | 'scrape-amazon' | 'monitor-price';

// 任务数据接口
export interface CrawlerJobData {
  jobId: string;
  type: CrawlerJobType;
  productId?: string;
  imageUrl?: string;
  keywords?: string;
  asin?: string;
  domain?: string;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private isConnected = false;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const redisHost = this.config.get('REDIS_HOST') || 'localhost';
    const redisPort = parseInt(this.config.get('REDIS_PORT') || '6379');

    try {
      // 创建队列 - 使用较短的超时
      this.queue = new Queue('tradenexus-crawler', {
        connection: { 
          host: redisHost, 
          port: redisPort,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null, // 不重试
          lazyConnect: true,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });

      // 设置错误处理器防止未捕获异常
      this.queue.on('error', (err) => {
        if (!this.isConnected) {
          // 已经知道连接失败，忽略后续错误
          return;
        }
        this.logger.error('Queue error:', err.message);
      });

      // 尝试连接，设置超时
      const connectPromise = this.queue.client;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('连接超时')), 3000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      this.isConnected = true;
      this.logger.log(`📮 Queue connected to Redis at ${redisHost}:${redisPort}`);

      // 启动内置 Worker (开发模式)
      if (this.config.get('NODE_ENV') !== 'production') {
        this.startInlineWorker();
      }
    } catch (error: any) {
      this.logger.warn(`⚠️ Queue connection failed - running in offline mode`);
      this.logger.warn(`   Reason: Redis not available at ${redisHost}:${redisPort}`);
      this.queue = null; // 清除队列引用
    }
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queue) {
      await this.queue.close();
    }
  }

  /**
   * 检查队列是否可用
   */
  get available(): boolean {
    return this.isConnected;
  }

  /**
   * 添加任务到队列
   */
  async addJob(type: CrawlerJobType, data: Omit<CrawlerJobData, 'type'>): Promise<string | null> {
    if (!this.queue || !this.isConnected) {
      this.logger.warn('队列不可用，任务将同步执行');
      return null;
    }

    const job = await this.queue.add(type, { ...data, type });
    this.logger.log(`任务已加入队列: ${type} (${job.id})`);
    return job.id || null;
  }

  /**
   * 获取队列状态
   */
  async getQueueStats() {
    if (!this.queue) {
      return { available: false, waiting: 0, active: 0, completed: 0, failed: 0 };
    }

    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return { available: true, waiting, active, completed, failed };
  }

  /**
   * 启动内置 Worker (开发模式)
   */
  private startInlineWorker() {
    const redisHost = this.config.get('REDIS_HOST') || 'localhost';
    const redisPort = parseInt(this.config.get('REDIS_PORT') || '6379');

    this.worker = new Worker(
      'tradenexus-crawler',
      async (job: Job<CrawlerJobData>) => {
        this.logger.log(`处理任务: ${job.name} (${job.id})`);
        
        // 更新数据库任务状态
        if (job.data.jobId && this.prisma.connected) {
          await this.prisma.job.update({
            where: { id: job.data.jobId },
            data: { status: 'running', startedAt: new Date() },
          });
        }

        try {
          const result = await this.processJob(job);

          // 更新完成状态
          if (job.data.jobId && this.prisma.connected) {
            await this.prisma.job.update({
              where: { id: job.data.jobId },
              data: { 
                status: 'completed', 
                completedAt: new Date(),
                progress: 100,
                outputData: result,
              },
            });
          }

          return result;
        } catch (error: any) {
          // 更新失败状态
          if (job.data.jobId && this.prisma.connected) {
            await this.prisma.job.update({
              where: { id: job.data.jobId },
              data: { 
                status: 'failed', 
                completedAt: new Date(),
                errorMessage: error.message,
              },
            });
          }
          throw error;
        }
      },
      { connection: { host: redisHost, port: redisPort } }
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`✅ 任务完成: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`❌ 任务失败: ${job?.id} - ${err.message}`);
    });

    this.logger.log('🔧 Inline Worker 已启动 (开发模式)');
  }

  /**
   * 处理任务
   */
  private async processJob(job: Job<CrawlerJobData>): Promise<any> {
    switch (job.data.type) {
      case 'search-1688':
        return this.processSearch1688(job.data);
      case 'scrape-amazon':
        return this.processScrapeAmazon(job.data);
      case 'monitor-price':
        return this.processMonitorPrice(job.data);
      default:
        throw new Error(`未知任务类型: ${job.data.type}`);
    }
  }

  private async processSearch1688(data: CrawlerJobData): Promise<any> {
    // TODO: 调用 Alibaba1688Service 执行搜索
    this.logger.log(`执行 1688 搜索: ${data.keywords || data.imageUrl}`);
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      resultsCount: 3,
      message: '搜索完成 (Mock)',
    };
  }

  private async processScrapeAmazon(data: CrawlerJobData): Promise<any> {
    this.logger.log(`抓取 Amazon: ${data.asin} @ ${data.domain}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, asin: data.asin };
  }

  private async processMonitorPrice(data: CrawlerJobData): Promise<any> {
    this.logger.log(`监控价格: ${data.productId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }
}
