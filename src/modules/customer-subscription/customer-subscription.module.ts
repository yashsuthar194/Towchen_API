import { Module } from '@nestjs/common';
import { CustomerSubscriptionController } from './customer-subscription.controller';
import { CustomerSubscriptionService } from './customer-subscription.service';
import { AdminSubscriptionController } from './admin-subscription.controller';

import { StorageModule } from '../../services/storage/storage.module';
import { JwtModule } from '../../services/jwt/jwt.module';

@Module({
  imports: [StorageModule, JwtModule],
  controllers: [CustomerSubscriptionController, AdminSubscriptionController],
  providers: [CustomerSubscriptionService],
  exports: [CustomerSubscriptionService],
})
export class CustomerSubscriptionModule {}
