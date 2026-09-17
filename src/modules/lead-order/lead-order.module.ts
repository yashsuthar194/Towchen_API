import { Module } from '@nestjs/common';
import { LeadOrderService } from './lead-order.service';
import { DriverLeadOrderController } from './driver-lead-order.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { LeadEvcrfService } from './lead-evcrf.service';
import { VehicleClassMappingModule } from '../vehicle-class-mapping/vehicle-class-mapping.module';
import { StorageModule } from 'src/services/storage/storage.module';
import { LeadReviewService } from './lead-review.service';
import { LeadReviewController } from './lead-review.controller';

@Module({
  imports: [PrismaModule, VehicleClassMappingModule, StorageModule],
  controllers: [DriverLeadOrderController, LeadReviewController],
  providers: [LeadOrderService, LeadEvcrfService, LeadReviewService],
  exports: [LeadOrderService, LeadEvcrfService, LeadReviewService],
})
export class LeadOrderModule {}
