import { Module } from '@nestjs/common';
import { VendorAuthModule } from './vendor-auth/vendor-auth.module';
import { DriverAuthModule } from './driver-auth/driver-auth.module';
import { SmsModule } from 'src/services/sms/sms.module';
import { MailModule } from 'src/services/mail/mail.module';

@Module({
  imports: [VendorAuthModule, DriverAuthModule],
})
export class AuthModule {}
