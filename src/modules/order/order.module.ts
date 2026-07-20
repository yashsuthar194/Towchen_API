import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { DriverOrderController } from './driver-order.controller';
import { OrderV2Controller } from './order-v2.controller';
import { ScheduledOrderService } from './scheduled-order.service';
import { ScheduledOrderProcessorService } from './scheduled-order-processor.service';
import { OrderNotificationService } from './order-notification.service';
import { OrderCreationService } from './order-creation.service';
import { OrderGateway } from './order.gateway';
import { OrderDispatchService } from './order-dispatch.service';
import { OrderDispatchEscalationService } from './order-dispatch-escalation.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { MapsModule } from 'src/services/maps/maps.module';
import { VoucherModule } from '../voucher/voucher.module';
import { WalletModule } from '../wallet/wallet.module';
import { SmsModule } from 'src/services/sms/sms.module';
import { StorageModule } from 'src/services/storage/storage.module';
import { EVCRFModule } from '../evcrf/evcrf.module';
import { VehicleClassMappingModule } from '../vehicle-class-mapping/vehicle-class-mapping.module';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [
    PrismaModule,
    MapsModule,
    VoucherModule,
    WalletModule,
    SmsModule,
    StorageModule,
    EVCRFModule,
    VehicleClassMappingModule,
    DispatchModule, // Phase 4 — provides DispatchService.rankVendorsByProximityAsync
  ],
  controllers: [OrderController, OrderV2Controller, DriverOrderController],
  providers: [
    OrderService,
    ScheduledOrderService,
    ScheduledOrderProcessorService,
    OrderNotificationService,
    OrderCreationService,
    OrderGateway,                      // Phase 3 — WebSocket gateway
    OrderDispatchService,              // Phase 5 — dispatch orchestrator
    OrderDispatchEscalationService,    // Phase 6 — 2-minute escalation cron
  ],
  exports: [OrderService, OrderCreationService, OrderGateway, OrderDispatchService],
})
export class OrderModule {}

