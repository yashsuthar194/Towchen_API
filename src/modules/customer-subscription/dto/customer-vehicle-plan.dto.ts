import { ApiProperty } from '@nestjs/swagger';
import { VehicleType, SubscriptionStatus } from '@prisma/client';
import { SubscriptionPlanDto } from '../../subscription-plan/dto/subscription-plan.dto';

export class CustomerVehicleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  make: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  registration_number: string;

  @ApiProperty({ enum: VehicleType })
  vehicle_type: VehicleType;
}

export class CustomerVehicleSubscriptionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  purchase_id: number;

  @ApiProperty()
  subscription_plan_id: number;

  @ApiProperty()
  customer_vehicle_id: number;

  @ApiProperty()
  plan_name: string;

  @ApiProperty()
  plan_pricing: number;

  @ApiProperty()
  plan_period_months: number;

  @ApiProperty()
  total_incidents_allowed: number;

  @ApiProperty()
  distance_km_allowed: number;

  @ApiProperty({ enum: VehicleType })
  vehicle_type: VehicleType;

  @ApiProperty()
  rc_book_url: string;

  @ApiProperty()
  starts_at: Date;

  @ApiProperty()
  expires_at: Date;

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class CustomerVehicleWithPlansDto {
  @ApiProperty({ type: () => CustomerVehicleDto })
  vehicle: CustomerVehicleDto;

  @ApiProperty({
    type: () => CustomerVehicleSubscriptionDto,
    required: false,
    nullable: true,
  })
  current_subscription: CustomerVehicleSubscriptionDto | null;

  @ApiProperty({ type: () => [SubscriptionPlanDto] })
  available_plans: SubscriptionPlanDto[];
}
