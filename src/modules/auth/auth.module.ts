import { Module } from '@nestjs/common';
import { VendorAuthModule } from './vendor-auth/vendor-auth.module';
import { DriverAuthModule } from './driver-auth/driver-auth.module';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';

@Module({
  imports: [VendorAuthModule, DriverAuthModule, CustomerAuthModule],
})
export class AuthModule { }
