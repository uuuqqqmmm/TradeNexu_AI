/**
 * 供应链模块 (1688 货源)
 */

import { Module } from '@nestjs/common';
import { SourcingService } from './sourcing.service';
import { SourcingController } from './sourcing.controller';
import { Alibaba1688Service } from './alibaba1688.service';

@Module({
  controllers: [SourcingController],
  providers: [SourcingService, Alibaba1688Service],
  exports: [SourcingService, Alibaba1688Service],
})
export class SourcingModule {}
