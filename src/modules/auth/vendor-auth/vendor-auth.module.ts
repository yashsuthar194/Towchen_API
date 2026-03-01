import { Module } from '@nestjs/common';
import { VendorAuthController } from './vendor-auth.controller';
import { VendorAuthService } from './vendor-auth.service';
import { MailModule } from 'src/services/mail/mail.module';
import { SmsModule } from 'src/services/sms/sms.module';

@Module({
  controllers: [VendorAuthController],
  providers: [VendorAuthService],
  imports: [MailModule, SmsModule],
})
export class VendorAuthModule {}
