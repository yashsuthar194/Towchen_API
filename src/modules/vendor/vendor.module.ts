import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { StorageModule } from 'src/services/storage';

@Module({
  controllers: [VendorController],
  providers: [VendorService],
  imports: [PrismaModule, StorageModule],
})
export class VendorModule {}
