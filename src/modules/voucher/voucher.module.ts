import { Module } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { JwtModule } from 'src/services/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  providers: [VoucherService],
  controllers: [VoucherController],
  exports: [VoucherService],
})
export class VoucherModule {}
