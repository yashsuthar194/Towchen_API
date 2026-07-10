import { Module } from '@nestjs/common';
import { EVCRFService } from './evcrf.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { VehicleClassMappingModule } from '../vehicle-class-mapping/vehicle-class-mapping.module';

import { StorageModule } from 'src/services/storage/storage.module';

@Module({
  imports: [PrismaModule, VehicleClassMappingModule, StorageModule],
  providers: [EVCRFService],
  exports: [EVCRFService],
})
export class EVCRFModule {}
