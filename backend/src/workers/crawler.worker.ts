/**
 * 爬虫 Worker - 后台任务处理
 * 
 * 功能:
 * 1. 监听 Redis 队列中的爬虫任务
 * 2. 使用 Puppeteer 抓取 1688/Amazon 数据
 * 3. 将结果存入数据库
 * 
 * 启动命令: npm run worker:crawler
 */

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
// import puppeteer from 'puppeteer-extra';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// puppeteer.use(StealthPlugin());

const prisma = new PrismaClient();

// Redis 连接配置
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// 任务处理器映射
const processors: Record<string, (job: Job) => Promise<any>> = {
  // 1688 搜索任务
  'search-1688': async (job: Job) => {
    const { productId, imageUrl, keywords } = job.data;
    console.log(`[Worker] 处理 1688 搜索任务: ${productId}`);

    try {
      // TODO: 实现真实的 Puppeteer 爬虫
      // const browser = await puppeteer.launch({
      //   headless: true,
      //   args: ['--no-sandbox', '--disable-setuid-sandbox'],
      // });
      // const page = await browser.newPage();
      // ...

      // Mock 结果
      const mockResults = [
        {
          supplierUrl: 'https://detail.1688.com/offer/mock123.html',
          supplierName: '测试供应商',
          costPrice: 45.00,
          currency: 'CNY',
          moq: 100,
          supplierRating: 4.5,
          shopYears: 3,
          matchScore: 0.85,
        },
      ];

      // 保存结果到数据库
      for (const result of mockResults) {
        await prisma.sourcingResult.create({
          data: {
            productId,
            ...result,
          },
        });
      }

      // 更新产品状态
      await prisma.product.update({
        where: { id: productId },
        data: { status: 'sourced' },
      });

      return { success: true, count: mockResults.length };
    } catch (error) {
      console.error(`[Worker] 1688 搜索失败:`, error);
      throw error;
    }
  },

  // Amazon 产品抓取任务
  'scrape-amazon': async (job: Job) => {
    const { asin, domain } = job.data;
    console.log(`[Worker] 抓取 Amazon 产品: ${asin} @ ${domain}`);

    // TODO: 实现 Amazon 抓取逻辑
    return { success: true, asin };
  },

  // 价格监控任务
  'monitor-price': async (job: Job) => {
    const { productId } = job.data;
    console.log(`[Worker] 监控价格: ${productId}`);

    // TODO: 实现价格监控逻辑
    return { success: true };
  },
};

// 创建 Worker
const worker = new Worker(
  'tradenexus-crawler',
  async (job: Job) => {
    const processor = processors[job.name];
    
    if (!processor) {
      throw new Error(`未知任务类型: ${job.name}`);
    }

    // 更新任务状态为运行中
    await prisma.job.update({
      where: { id: job.data.jobId },
      data: { 
        status: 'running',
        startedAt: new Date(),
      },
    });

    try {
      const result = await processor(job);

      // 更新任务状态为完成
      await prisma.job.update({
        where: { id: job.data.jobId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          progress: 100,
          outputData: result,
        },
      });

      return result;
    } catch (error: any) {
      // 更新任务状态为失败
      await prisma.job.update({
        where: { id: job.data.jobId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });

      throw error;
    }
  },
  { connection: redisConnection }
);

// Worker 事件监听
worker.on('completed', (job) => {
  console.log(`[Worker] 任务完成: ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] 任务失败: ${job?.id}`, err.message);
});

worker.on('error', (err) => {
  console.error('[Worker] 错误:', err);
});

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🕷️  TradeNexus Crawler Worker Started                    ║
║                                                            ║
║   Listening for jobs on queue: tradenexus-crawler          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('[Worker] 收到 SIGTERM，正在关闭...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
