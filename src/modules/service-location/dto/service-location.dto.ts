import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Slim response DTO for a single location_pricing row. */
export class LocationPricingDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1, description: 'ID of the ServiceArea location' })
  location_id: number;

  @ApiProperty({ example: 2, description: 'ID of the sub-service this ceiling applies to' })
  sub_service_id: number;

  @ApiProperty({ example: 20, description: 'Km included in the base price (no extra charge below this)' })
  fix_distance: number;

  @ApiProperty({ example: 2000, description: 'Maximum base price vendor can charge for this sub-service' })
  fix_price: number;

  @ApiProperty({ example: 25, description: 'Maximum per-km rate vendor can charge beyond fix_distance' })
  extra_price: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

/** Full response DTO for a ServiceArea location, including its pricing ceilings. */
export class ServiceLocationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Naroda', description: 'Admin-given human-readable name (stored in description field)' })
  name: string;

  @ApiProperty({ example: 'ChIJv6IvMQEDDTkRxABw1XMp4co' })
  place_id: string;

  @ApiProperty({ example: 'Naroda Industrial Estate, Ahmedabad, Gujarat 382330, India' })
  address: string;

  @ApiPropertyOptional({ example: 'Naroda' })
  area: string | null;

  @ApiProperty({ example: 'Ahmedabad' })
  city: string;

  @ApiProperty({ example: 'Gujarat' })
  state: string;

  @ApiPropertyOptional({ example: '382330' })
  pincode: string | null;

  @ApiProperty({ example: 23.07 })
  latitude: number;

  @ApiProperty({ example: 72.67 })
  longitude: number;

  @ApiProperty({ type: [LocationPricingDto] })
  location_pricings: LocationPricingDto[];

  @ApiProperty()
  created_at: Date;
}
