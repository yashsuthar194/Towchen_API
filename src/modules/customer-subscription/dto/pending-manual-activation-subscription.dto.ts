import { ApiProperty } from '@nestjs/swagger';
import { CustomerVehicleSubscriptionDto } from './customer-vehicle-plan.dto';
import { CustomerVehicleDto } from './customer-vehicle-plan.dto';

export class SubscriptionCustomerDetailsDto {
  @ApiProperty()
  full_name: string;

  @ApiProperty()
  number: string;
}

export class PendingManualActivationSubscriptionDto extends CustomerVehicleSubscriptionDto {
  @ApiProperty({ type: () => SubscriptionCustomerDetailsDto })
  customer: SubscriptionCustomerDetailsDto;

  @ApiProperty({ type: () => CustomerVehicleDto })
  customer_vehicle: CustomerVehicleDto;
}
