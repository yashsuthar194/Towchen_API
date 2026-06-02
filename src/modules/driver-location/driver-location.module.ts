import { Module } from '@nestjs/common';
import { DriverLocationService } from './driver-location.service';
import { DriverLocationController } from './driver-location.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';

import { LocationModule } from '../location/location.module';

@Module({
  imports: [PrismaModule, LocationModule],
  controllers: [DriverLocationController],
  providers: [DriverLocationService],
  exports: [DriverLocationService],
})
export class DriverLocationModule {}
