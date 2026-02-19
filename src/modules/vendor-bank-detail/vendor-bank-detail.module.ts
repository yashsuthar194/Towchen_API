import { Module } from '@nestjs/common';
import { VendorBankDetailController } from './vendor-bank-detail.controller';
import { VendorBankDetailService } from './vendor-bank-detail.service';
import { PrismaModule } from 'src/core/prisma/prisma.module';

@Module({
  controllers: [VendorBankDetailController],
  providers: [VendorBankDetailService],
  imports: [PrismaModule],
})
export class VendorBankDetailModule {}
