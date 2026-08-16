import { ApiProperty } from '@nestjs/swagger';

/** Represents a single vendor pricing row returned to the vendor. */
export class VendorPricingDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1, description: 'Sub-service this pricing applies to' })
  sub_service_id: number;

  @ApiProperty({ example: 20, description: 'Included km in the base price' })
  fix_distance: number;

  @ApiProperty({ example: 1800, description: 'Base price the vendor charges' })
  fix_price: number;

  @ApiProperty({ example: 22, description: 'Rate per extra km' })
  extra_price: number;

  @ApiProperty()
  updated_at: Date;
}

/** Vendor pricing row enriched with the location ceiling for comparison. */
export class VendorPricingWithCeilingDto extends VendorPricingDto {
  @ApiProperty({
    example: 2000,
    nullable: true,
    description: 'Location ceiling for fix_price — vendor cannot exceed this',
  })
  ceiling_fix_price: number | null;

  @ApiProperty({
    example: 25,
    nullable: true,
    description: 'Location ceiling for extra_price — vendor cannot exceed this',
  })
  ceiling_extra_price: number | null;
}
