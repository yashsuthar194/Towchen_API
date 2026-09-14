import { ApiProperty } from '@nestjs/swagger';
import { CustomerVehicleSubscriptionDto } from './customer-vehicle-plan.dto';
import { PurchaseStatus } from '@prisma/client';

export class CustomerSubscriptionPurchaseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  customer_id: number;

  @ApiProperty()
  total_amount: number;

  @ApiProperty({ enum: PurchaseStatus })
  status: PurchaseStatus;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class CustomerSubscriptionPurchaseResultDto {
  @ApiProperty({ type: () => CustomerSubscriptionPurchaseDto })
  purchase: CustomerSubscriptionPurchaseDto;

  @ApiProperty({ type: () => [CustomerVehicleSubscriptionDto] })
  subscriptions: CustomerVehicleSubscriptionDto[];
}
