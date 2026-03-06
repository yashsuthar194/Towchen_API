import { Module } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { SmsModule } from 'src/services/sms/sms.module';
import { JwtModule } from 'src/services/jwt/jwt.module';

@Module({
    imports: [SmsModule, JwtModule],
    controllers: [CustomerAuthController],
    providers: [CustomerAuthService, PrismaService],
    exports: [CustomerAuthService],
})
export class CustomerAuthModule { }
