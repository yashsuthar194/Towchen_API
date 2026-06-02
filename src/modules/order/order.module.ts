import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController, OrderDriverController } from './order.controller';
import { OrderV2Controller } from './order-v2.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { MapsModule } from 'src/services/maps/maps.module';
import { VoucherModule } from '../voucher/voucher.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, MapsModule, VoucherModule, WalletModule],
  controllers: [OrderController, OrderV2Controller, OrderDriverController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule { }
