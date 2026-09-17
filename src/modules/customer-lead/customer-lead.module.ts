import { Module } from '@nestjs/common';
import { CustomerLeadController } from './customer-lead.controller';
import { CustomerLeadService } from './customer-lead.service';
import { OrderModule } from '../order/order.module';
import { LeadOrderModule } from '../lead-order/lead-order.module';

@Module({
  imports: [OrderModule, LeadOrderModule],
  controllers: [CustomerLeadController],
  providers: [CustomerLeadService]
})
export class CustomerLeadModule {}
