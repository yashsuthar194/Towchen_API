import { Module } from '@nestjs/common';
import { VendorAuthController } from './vendor-auth.controller';
import { VendorAuthService } from './vendor-auth.service';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { SmsModule } from 'src/services/sms/sms.module';
import { MailModule } from 'src/services/mail/mail.module';

@Module({
  controllers: [VendorAuthController],
  providers: [VendorAuthService],
  imports: [PrismaModule, SmsModule, MailModule],
})
export class VendorAuthModule {}
