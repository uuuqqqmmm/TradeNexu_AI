/**
 * Amazon 模块
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AmazonController } from './amazon.controller';
import { AmazonService } from './amazon.service';

@Module({
  imports: [ConfigModule],
  controllers: [AmazonController],
  providers: [AmazonService],
  exports: [AmazonService],
})
export class AmazonModule {}
