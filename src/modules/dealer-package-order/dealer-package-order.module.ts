import { Module } from '@nestjs/common';
import { DealerPackageOrderController } from './dealer-package-order.controller';
import { DealerPackageOrderService } from './dealer-package-order.service';
import { PackagePdfService } from './services/package-pdf.service';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { StorageModule } from 'src/services/storage/storage.module';
import { JwtModule } from 'src/services/jwt/jwt.module';

@Module({
  imports: [PrismaModule, StorageModule, JwtModule],
  controllers: [DealerPackageOrderController],
  providers: [DealerPackageOrderService, PackagePdfService],
  exports: [DealerPackageOrderService],
})
export class DealerPackageOrderModule {}
