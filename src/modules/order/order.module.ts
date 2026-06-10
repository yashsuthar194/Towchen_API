import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { DriverOrderController } from './driver-order.controller';
import { OrderV2Controller } from './order-v2.controller';
import { ScheduledOrderService } from './scheduled-order.service';
import { ScheduledOrderProcessorService } from './scheduled-order-processor.service';
import { OrderNotificationService } from './order-notification.service';
import { OrderCreationService } from './order-creation.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { MapsModule } from 'src/services/maps/maps.module';
import { VoucherModule } from '../voucher/voucher.module';
import { WalletModule } from '../wallet/wallet.module';
import { SmsModule } from 'src/services/sms/sms.module';
import { StorageModule } from 'src/services/storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    MapsModule,
    VoucherModule,
    WalletModule,
    SmsModule,
    StorageModule,
  ],
  controllers: [OrderController, OrderV2Controller, DriverOrderController],
  providers: [
    OrderService,
    ScheduledOrderService,
    ScheduledOrderProcessorService,
    OrderNotificationService,
    OrderCreationService,
  ],
  exports: [OrderService, OrderCreationService],
})
export class OrderModule {}
