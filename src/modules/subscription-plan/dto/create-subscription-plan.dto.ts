import { IsNotEmpty, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ description: 'Name of the subscription plan', example: 'Premium Two Wheeler Plan' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Pricing of the plan', example: 499.99 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pricing: number;

  @ApiProperty({ description: 'Duration of the plan in months', example: 12 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  plan_period_months: number;

  @ApiProperty({ description: 'Number of incidents covered', example: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  incidents: number;

  @ApiProperty({ description: 'Distance covered in km', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  distance_km: number;

  @ApiProperty({ description: 'Vehicle type this plan applies to', enum: VehicleType })
  @IsNotEmpty()
  @IsEnum(VehicleType)
  vehicle_type: VehicleType;
}
