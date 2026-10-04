import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CarSegment } from '@prisma/client';

export class DealerPackagePlanDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Gold Mobility Shield' })
  name: string;

  @ApiProperty({ example: 12 })
  plan_period_months: number;

  @ApiProperty({ example: 4 })
  incidents: number;

  @ApiProperty({ example: 50.0 })
  distance_km: number;

  @ApiProperty({ example: 2 })
  hotel_accommodation: number;

  @ApiProperty({ example: 2 })
  cab_service: number;

  @ApiProperty({ example: 1999.0 })
  price_basic: number;

  @ApiProperty({ example: 2999.0 })
  price_standard: number;

  @ApiProperty({ example: 4999.0 })
  price_premium: number;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: '2026-10-04T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-10-04T12:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ example: 1999.0, description: 'Resolved price if car segment query was passed' })
  resolved_price?: number;

  @ApiPropertyOptional({ enum: CarSegment, example: CarSegment.Basic, description: 'Selected car segment' })
  selected_segment?: CarSegment;
}
