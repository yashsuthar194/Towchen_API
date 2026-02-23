import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { TwilioService } from 'src/services/twilio/twilio.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { OtpController } from './otp.controller';
import { EmailOtpController } from './email-otp.controller';
import { VerificationOtpController } from './verification-otp.controller';
import { MailService } from 'src/services/mail/mail.service';

@Module({
  controllers: [OtpController, EmailOtpController, VerificationOtpController],
  providers: [OtpService, TwilioService, MailService, PrismaService],
  exports: [OtpService],
})
export class OtpModule { }
