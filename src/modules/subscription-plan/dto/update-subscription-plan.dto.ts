import { IsOptional, IsString, IsNumber, IsEnum, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({ description: 'Name of the subscription plan', example: 'Premium Two Wheeler Plan' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Pricing of the plan', example: 499.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricing?: number;

  @ApiPropertyOptional({ description: 'Duration of the plan in months', example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  plan_period_months?: number;

  @ApiPropertyOptional({ description: 'Number of incidents covered', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  incidents?: number;

  @ApiPropertyOptional({ description: 'Distance covered in km', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distance_km?: number;

  @ApiPropertyOptional({ description: 'Vehicle type this plan applies to', enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicle_type?: VehicleType;
  
  @ApiPropertyOptional({ description: 'Status of the plan', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
