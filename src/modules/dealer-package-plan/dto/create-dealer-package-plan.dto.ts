import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDealerPackagePlanDto {
  @ApiProperty({ example: 'Gold Mobility Shield', description: 'Name of the package plan' })
  @IsString()
  @IsNotEmpty({ message: 'Plan name is required' })
  name: string;

  @ApiProperty({ example: 12, description: 'Duration in months' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  plan_period_months: number;

  @ApiProperty({ example: 4, description: 'Total breakdown incidents allowed' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  incidents: number;

  @ApiProperty({ example: 50.0, description: 'Towing or assistance distance limit in kilometers' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance_km: number;

  @ApiPropertyOptional({ example: 2, default: 0, description: 'Hotel accommodation stays/claims covered' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  hotel_accommodation?: number = 0;

  @ApiPropertyOptional({ example: 2, default: 0, description: 'Cab service rides/claims covered' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  cab_service?: number = 0;

  @ApiProperty({ example: 1999.0, description: 'Price for Basic car segment (e.g. Swift, Dzire)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_basic: number;

  @ApiProperty({ example: 2999.0, description: 'Price for Standard car segment (e.g. Creta, City)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_standard: number;

  @ApiProperty({ example: 4999.0, description: 'Price for Premium car segment (e.g. Mercedes, BMW)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_premium: number;

  @ApiPropertyOptional({ example: true, default: true, description: 'Whether the plan is active' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  is_active?: boolean = true;
}
