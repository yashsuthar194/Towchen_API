import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController, OrderDriverController } from './order.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrderController, OrderDriverController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
