import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { JwtModule } from 'src/services/jwt/jwt.module';
import { VoucherModule } from '../voucher/voucher.module';

@Module({
  imports: [JwtModule, VoucherModule],
  controllers: [CustomerController],
  providers: [CustomerService]
})
export class CustomerModule {}
