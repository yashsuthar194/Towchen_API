import { Module } from '@nestjs/common';
import { DealerPackagePlanController } from './dealer-package-plan.controller';
import { DealerPackagePlanService } from './dealer-package-plan.service';
import { PrismaModule } from 'src/core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DealerPackagePlanController],
  providers: [DealerPackagePlanService],
  exports: [DealerPackagePlanService],
})
export class DealerPackagePlanModule {}
