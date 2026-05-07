import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController, OrderDriverController } from './order.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { MapsModule } from 'src/services/maps/maps.module';

@Module({
  imports: [PrismaModule, MapsModule],
  controllers: [OrderController, OrderDriverController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule { }
