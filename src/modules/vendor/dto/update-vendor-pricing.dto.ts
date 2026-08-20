import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** DTO used by a vendor to update their own pricing for a specific location and sub-service. */
export class UpdateVendorPricingDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the ServiceArea location being updated',
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  location_id: number;
  @ApiProperty({
    example: 1800,
    description: 'Base price for trips within fix_distance (cannot exceed location ceiling)',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fix_price: number;

  @ApiProperty({
    example: 22,
    description: 'Rate per extra km beyond fix_distance (cannot exceed location ceiling)',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  extra_price: number;
}
