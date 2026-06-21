import { Module } from '@nestjs/common';
import { EJobCardService } from './e-job-card.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { VehicleClassMappingModule } from '../vehicle-class-mapping/vehicle-class-mapping.module';

import { StorageModule } from 'src/services/storage/storage.module';

@Module({
  imports: [PrismaModule, VehicleClassMappingModule, StorageModule],
  providers: [EJobCardService],
  exports: [EJobCardService],
})
export class EJobCardModule {}
