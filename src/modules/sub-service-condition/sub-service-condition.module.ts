import { Module } from '@nestjs/common';
import { SubServiceConditionService } from './sub-service-condition.service';
import { SubServiceConditionController } from './sub-service-condition.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { JwtModule } from 'src/services/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [SubServiceConditionController],
  providers: [SubServiceConditionService],
  exports: [SubServiceConditionService],
})
export class SubServiceConditionModule {}
