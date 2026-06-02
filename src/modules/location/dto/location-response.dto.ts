import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Fully resolved address object returned after resolving a Google Maps place_id.
 *
 * @remarks
 * Step 2 of the address flow. Contains all address fields including
 * latitude and longitude (stored in DB for future distance calculations).
 * This object is also saved directly to the location table during order creation.
 */
export class LocationResponseDto {
  @ApiPropertyOptional({
    description: 'The original Google Maps place_id used to resolve this address',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  place_id?: string;

  @ApiPropertyOptional({
    description: 'Full formatted address string',
    example: '1, Sector 1, Gandhinagar, Gujarat 382001, India',
  })
  address?: string;

  @ApiPropertyOptional({
    description: 'Street name or house/plot number and road',
    example: 'Sector 1 Main Road',
  })
  street?: string;

  @ApiPropertyOptional({
    description: 'Area, locality, or sub-locality',
    example: 'Sector 1',
  })
  area?: string;

  @ApiPropertyOptional({ description: 'City or town name', example: 'Gandhinagar' })
  city?: string;

  @ApiPropertyOptional({ description: 'State name', example: 'Gujarat' })
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code / Pincode', example: '382001' })
  pincode?: string;

  @ApiPropertyOptional({ description: 'Country name', example: 'India' })
  country?: string;

  @ApiProperty({
    description: 'Latitude coordinate (used for distance calculations)',
    example: 23.2156,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate (used for distance calculations)',
    example: 72.6369,
  })
  longitude: number;

  @ApiPropertyOptional({
    description: 'Nearby landmark (e.g. Near GH-1 Circle)',
    example: 'Near GH-1 Circle',
  })
  landmark?: string;
}
