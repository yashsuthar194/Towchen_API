import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { JwtModule } from 'src/services/jwt/jwt.module';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import { ConsentActionDispatcherService } from './handlers/consent-action-dispatcher.service';
import { OrderEditConsentHandler } from './handlers/order-edit-consent.handler';
import { ConsentRoleGuard } from './guards/consent-role.guard';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ConsentController],
  providers: [
    ConsentService,
    ConsentActionDispatcherService,
    OrderEditConsentHandler,
    ConsentRoleGuard,
  ],
  exports: [ConsentService, ConsentActionDispatcherService],
})
export class ConsentModule {}
