import { Module } from '@nestjs/common';
import { DriverLocationService } from './driver-location.service';
import { DriverLocationController } from './driver-location.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DriverLocationController],
  providers: [DriverLocationService],
  exports: [DriverLocationService],
})
export class DriverLocationModule {}
