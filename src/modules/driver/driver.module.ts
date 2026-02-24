import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { StorageModule } from 'src/services/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [DriverController],
  providers: [DriverService]
})
export class DriverModule { }
