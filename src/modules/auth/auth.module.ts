import { Module } from '@nestjs/common';
import { VendorAuthModule } from './vendor-auth/vendor-auth.module';
import { DriverAuthModule } from './driver-auth/driver-auth.module';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';

@Module({
  imports: [VendorAuthModule, DriverAuthModule, CustomerAuthModule, AdminAuthModule],
})
export class AuthModule { }
