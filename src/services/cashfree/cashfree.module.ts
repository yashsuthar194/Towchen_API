import { Module } from '@nestjs/common';
import { CashfreeService } from './cashfree.service';
import { CashfreeController } from './cashfree.controller';
import { CashfreeRateLimiterService } from './cashfree-rate-limiter.service';

@Module({
  controllers: [CashfreeController],
  providers: [CashfreeService, CashfreeRateLimiterService],
  exports: [CashfreeService, CashfreeRateLimiterService],
})
export class CashfreeModule {}

