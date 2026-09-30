import { Module } from '@nestjs/common';
import { DealerAuthController } from './dealer-auth.controller';
import { DealerAuthService } from './dealer-auth.service';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { JwtModule } from 'src/services/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [DealerAuthController],
  providers: [DealerAuthService],
  exports: [DealerAuthService],
})
export class DealerAuthModule {}
