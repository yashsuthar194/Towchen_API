import { Module } from '@nestjs/common';
import { DriverAuthService } from './driver-auth.service';
import { DriverAuthController } from './driver-auth.controller';
import { MailModule } from 'src/services/mail/mail.module';
import { SmsModule } from 'src/services/sms/sms.module';

@Module({
  providers: [DriverAuthService],
  controllers: [DriverAuthController],
  imports: [MailModule, SmsModule],
})
export class DriverAuthModule {}
