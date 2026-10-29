import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { StorageModule } from 'src/services/storage/storage.module';
import { JwtModule } from 'src/services/jwt/jwt.module';
import { AdminPackageOrderController } from './admin-package-order.controller';
import { AdminPackageOrderService } from './admin-package-order.service';

@Module({
  imports: [PrismaModule, StorageModule, JwtModule],
  controllers: [AdminPackageOrderController],
  providers: [AdminPackageOrderService],
  exports: [AdminPackageOrderService],
})
export class AdminPackageOrderModule {}
