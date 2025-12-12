/**
 * TradeNexus Backend - 入口文件
 * 版本: v3.0
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS 配置
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Swagger API 文档
  const config = new DocumentBuilder()
    .setTitle('TradeNexus AI API')
    .setDescription('跨境电商智能体协作平台 API 文档')
    .setVersion('3.0')
    .addBearerAuth()
    .addTag('auth', '认证模块')
    .addTag('products', '产品管理')
    .addTag('sourcing', '供应链 (1688)')
    .addTag('compliance', '合规检查')
    .addTag('ai', 'AI 分析')
    .addTag('jobs', '任务队列')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 启动服务
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║   🚀 TradeNexus AI Backend v3.0                            ║
  ║                                                            ║
  ║   Server running at: http://localhost:${port}                 ║
  ║   API Docs:          http://localhost:${port}/api/docs        ║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
