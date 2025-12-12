/**
 * 任务队列模块
 */

import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { QueueService } from './queue.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, QueueService],
  exports: [JobsService, QueueService],
})
export class JobsModule {}
