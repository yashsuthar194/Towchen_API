import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { StorageModule } from 'src/services/storage/storage.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  controllers: [VendorController],
  providers: [VendorService],
  imports: [PrismaModule, StorageModule, OtpModule],
})
export class VendorModule { }
