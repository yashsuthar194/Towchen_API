import { ApiProperty } from '@nestjs/swagger';

/** Represents a single vendor pricing row returned to the vendor. */
export class VendorPricingDto {
  @ApiProperty({ example: 1, nullable: true })
  id: number | null;

  @ApiProperty({ example: 1, description: 'ServiceArea location this pricing applies to' })
  location_id: number;

  @ApiProperty({ example: 1, description: 'Sub-service this pricing applies to' })
  sub_service_id: number;

  @ApiPropertyOptional({ example: 1800, description: 'Vendor base price' })
  base_price: number | null;

  @ApiPropertyOptional({ example: 22, description: 'Vendor per-km extra rate' })
  extra_distance_price: number | null;

  @ApiProperty({ nullable: true })
  updated_at: Date | null;
}

/** Vendor pricing row enriched with the location ceiling for comparison. */
export class VendorPricingWithCeilingDto extends VendorPricingDto {
  @ApiPropertyOptional({
    example: 2000,
    description: 'Location ceiling for base_price — vendor cannot exceed this',
  })
  ceiling_base_price: number | null;

  @ApiPropertyOptional({
    example: 25,
    description: 'Location ceiling for extra_distance_price — vendor cannot exceed this',
  })
  ceiling_extra_distance_price: number | null;
}
