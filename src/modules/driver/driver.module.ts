import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { StorageModule } from 'src/services/storage/storage.module';
import { JwtModule } from 'src/services/jwt/jwt.module';

import { DriverProfileController } from './driver-profile.controller';

@Module({
  imports: [PrismaModule, StorageModule, JwtModule],
  controllers: [DriverController, DriverProfileController],
  providers: [DriverService],
})
export class DriverModule {}
