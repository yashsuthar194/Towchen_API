import { Module } from '@nestjs/common';
import { CashfreeService } from './cashfree.service';
import { CashfreeController } from './cashfree.controller';

@Module({
  controllers: [CashfreeController],
  providers: [CashfreeService],
  exports: [CashfreeService],
})
export class CashfreeModule {}

