import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';

export class SubscriptionPlanDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  pricing: number;

  @ApiProperty()
  plan_period_months: number;

  @ApiProperty()
  incidents: number;

  @ApiProperty()
  distance_km: number;

  @ApiProperty({ enum: VehicleType })
  vehicle_type: VehicleType;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
