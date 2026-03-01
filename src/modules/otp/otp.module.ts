import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { OtpController } from './otp.controller';
import { EmailOtpController } from './email-otp.controller';
import { VerificationOtpController } from './verification-otp.controller';
import { MailModule } from 'src/services/mail/mail.module';
import { SmsModule } from 'src/services/sms/sms.module';

@Module({
  imports: [MailModule, SmsModule],
  // controllers: [OtpController, EmailOtpController, VerificationOtpController],
  providers: [OtpService, PrismaService],
  exports: [OtpService],
})
export class OtpModule {}
