import { Module } from '@nestjs/common';
import { EJobCardService } from './e-job-card.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { VehicleClassMappingModule } from '../vehicle-class-mapping/vehicle-class-mapping.module';

@Module({
  imports: [PrismaModule, VehicleClassMappingModule],
  providers: [EJobCardService],
  exports: [EJobCardService],
})
export class EJobCardModule {}
