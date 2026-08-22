import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { StorageModule } from 'src/services/storage/storage.module';
import { OtpModule } from '../otp/otp.module';
import { LocationModule } from '../location/location.module';

import { VendorPricingController } from './vendor-pricing.controller';
import { VendorPricingService } from './vendor-pricing.service';

@Module({
  controllers: [VendorController, VendorPricingController],
  providers: [VendorService, VendorPricingService],
  imports: [PrismaModule, StorageModule, OtpModule, LocationModule],
})
export class VendorModule { }
