import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationResponseDto } from './location-response.dto';
import { DistanceMatrixLegDto } from 'src/services/maps/types/distance-matrix-result.dto';

/**
 * Pricing breakdown for a single sub-service, calculated using actual road distance.
 */
export class PricedSubServiceDto {
  @ApiProperty({ description: 'Sub-service ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Sub-service name', example: 'Flatbed Towing' })
  name: string;

  @ApiProperty({
    description: 'Fixed distance covered by the base price (in km)',
    example: 10,
  })
  fix_distance: number;

  @ApiProperty({
    description:
      'Fixed base price charged regardless of distance (up to fix_distance). ' +
      'Formatted with rupee symbol.',
    example: '₹500',
  })
  fix_price_formatted: string;

  @ApiProperty({
    description:
      'Rate charged per km beyond the fix_distance. Formatted with rupee symbol.',
    example: '₹25/km',
  })
  extra_price_per_km_formatted: string;

  @ApiProperty({
    description: 'Actual road distance between breakdown and dropoff locations (in km)',
    example: '15.20 km',
  })
  calculated_distance_formatted: string;

  @ApiPropertyOptional({
    description:
      'Extra charge applied for the distance beyond fix_distance. ' +
      '0 when within the fixed zone. Formatted with rupee symbol.',
    example: '₹130',
  })
  extra_charge_formatted: string;

  @ApiProperty({
    description:
      'Total price = fix_price + extra_charge. Formatted with rupee symbol.',
    example: '₹630',
  })
  total_price_formatted: string;

  // --- Raw numeric values for programmatic use ---

  @ApiProperty({ description: 'fix_price as raw number', example: 500 })
  fix_price: number;

  @ApiProperty({ description: 'extra_price per km as raw number', example: 25 })
  extra_price_per_km: number;

  @ApiProperty({ description: 'Actual distance in km as raw number', example: 15.2 })
  calculated_distance_km: number;

  @ApiProperty({ description: 'Extra charge as raw number', example: 130 })
  extra_charge: number;

  @ApiProperty({ description: 'Total price as raw number', example: 630 })
  total_price: number;
}

/**
 * Full response from GET /location/estimate.
 *
 * @remarks
 * Contains resolved addresses for both locations, Google Distance Matrix
 * metrics, and all sub-services with real-time pricing applied.
 */
export class OrderEstimateResponseDto {
  @ApiProperty({
    description: 'Fully resolved breakdown (pickup) location',
    type: LocationResponseDto,
  })
  breakdown_location: LocationResponseDto;

  @ApiProperty({
    description: 'Fully resolved drop-off (destination) location',
    type: LocationResponseDto,
  })
  dropoff_location: LocationResponseDto;

  @ApiProperty({
    description: 'Real road distance between the two locations',
    type: DistanceMatrixLegDto,
  })
  distance: DistanceMatrixLegDto;

  @ApiProperty({
    description: 'Estimated travel time without real-time traffic',
    type: DistanceMatrixLegDto,
  })
  travel_time: DistanceMatrixLegDto;

  @ApiPropertyOptional({
    description:
      'Traffic-aware travel time. Only populated when the Google Maps key ' +
      'supports the Distance Matrix Advanced feature.',
    type: DistanceMatrixLegDto,
  })
  traffic_aware_duration?: DistanceMatrixLegDto;

  @ApiProperty({
    description: 'All active sub-services with pricing calculated for this journey',
    type: [PricedSubServiceDto],
  })
  sub_services: PricedSubServiceDto[];
}
