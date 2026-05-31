import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationResponseDto } from './location-response.dto';
import { DistanceMatrixLegDto } from 'src/services/maps/types/distance-matrix-result.dto';
import { JourneyType } from '@prisma/client';
import { SubServiceConditionDto } from '../../vendor/dto/service.dto';

/**
 * ETA details for the nearest available service location to the breakdown point.
 */
export class ServiceArrivalEstimateDto {
  @ApiProperty({
    description: 'Road distance from the nearest service location to the breakdown point',
    type: DistanceMatrixLegDto,
  })
  distance: DistanceMatrixLegDto;

  @ApiProperty({
    description: 'Estimated travel time (without traffic) to the breakdown point',
    type: DistanceMatrixLegDto,
  })
  eta: DistanceMatrixLegDto;

  @ApiPropertyOptional({
    description: 'Traffic-aware travel time (premium API key required)',
    type: DistanceMatrixLegDto,
  })
  traffic_aware_eta?: DistanceMatrixLegDto;
}

/**
 * Pricing breakdown for a single sub-service, calculated using actual road distance.
 */
export class PricedSubServiceDto {
  @ApiProperty({ description: 'Sub-service ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Sub-service name', example: 'Flatbed Towing' })
  name: string;

  @ApiProperty({ description: 'Weight capacity in tons', example: 1.5 })
  ton: number;

  @ApiProperty({
    description: 'Fixed distance covered by the base price (in km)',
    example: 10,
  })
  base_distance_int: number;

  @ApiProperty({
    description:
      'Fixed base price charged regardless of distance (up to base_distance). ' +
      'Formatted with rupee symbol.',
    example: '₹500',
  })
  base_rate_string: string;

  @ApiProperty({
    description:
      'Rate charged per km beyond the base_distance. Formatted with rupee symbol.',
    example: '₹25/km',
  })
  extra_distance_string: string;

  @ApiProperty({
    description: 'Actual road distance between breakdown and dropoff locations (in km)',
    example: '15.20 km',
  })
  calculated_distance_string: string;

  @ApiPropertyOptional({
    description:
      'Extra charge applied for the distance beyond base_distance. ' +
      '0 when within the fixed zone. Formatted with rupee symbol.',
    example: '₹130',
  })
  extra_distance_rate_string: string;

  @ApiProperty({
    description:
      'Total price = base_rate + extra_distance_rate. Formatted with rupee symbol.',
    example: '₹630',
  })
  final_amount_string: string;

  // --- Raw numeric values for programmatic use ---

  @ApiProperty({ description: 'base_rate as raw number', example: 500 })
  base_rate_int: number;

  @ApiProperty({ description: 'extra_distance per km as raw number', example: 25 })
  extra_distance_int: number;

  @ApiProperty({ description: 'Actual distance in km as raw number', example: 15.2 })
  calculated_distance_int: number;

  @ApiProperty({ description: 'Extra charge as raw number', example: 130 })
  extra_distance_rate_int: number;

  @ApiProperty({ description: 'Total price as raw number', example: 630 })
  final_amount_int: number;

  @ApiPropertyOptional({
    description:
      'ETA estimate for the nearest available service location to reach the breakdown location. ' +
      'Null when no service location is available for this sub-service.',
    type: ServiceArrivalEstimateDto,
  })
  arrival_estimate?: ServiceArrivalEstimateDto | null;

  @ApiPropertyOptional({ required: false, nullable: true })
  image_url?: string | null;

  @ApiProperty({ enum: JourneyType })
  journey_type: JourneyType;

  @ApiProperty({ description: 'CGST rate percentage', example: 9 })
  cgst_rate_int: number;

  @ApiProperty({ description: 'SGST rate percentage', example: 9 })
  sgst_rate_int: number;

  @ApiProperty({ description: 'Other tax rate percentage', example: 0 })
  other_tax_rate_int: number;

  @ApiProperty({ description: 'CGST amount', example: 56.7 })
  cgst_int: number;

  @ApiProperty({ description: 'SGST amount', example: 56.7 })
  sgst_int: number;

  @ApiProperty({ description: 'Other tax amount', example: 0 })
  other_tax_int: number;

  @ApiProperty({ description: 'Grand total including taxes', example: 743.4 })
  grand_total_int: number;

  @ApiProperty({ description: 'CGST formatted with rupee symbol', example: '₹56.70' })
  cgst_string: string;

  @ApiProperty({ description: 'SGST formatted with rupee symbol', example: '₹56.70' })
  sgst_string: string;

  @ApiProperty({ description: 'Other tax formatted with rupee symbol', example: '₹0.00' })
  other_tax_string: string;

  @ApiProperty({ description: 'Grand total formatted with rupee symbol', example: '₹743.40' })
  grand_total_string: string;

  @ApiProperty({ type: [SubServiceConditionDto] })
  conditions: SubServiceConditionDto[];
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

  @ApiPropertyOptional({
    description: 'Fully resolved drop-off (destination) location. Null for ThreeWay journeys.',
    type: LocationResponseDto,
    nullable: true,
  })
  dropoff_location?: LocationResponseDto | null;

  @ApiPropertyOptional({
    description: 'Real road distance between the two locations. Null for ThreeWay journeys.',
    type: DistanceMatrixLegDto,
    nullable: true,
  })
  distance?: DistanceMatrixLegDto | null;

  @ApiPropertyOptional({
    description: 'Estimated travel time without real-time traffic. Null for ThreeWay journeys.',
    type: DistanceMatrixLegDto,
    nullable: true,
  })
  travel_time?: DistanceMatrixLegDto | null;

  @ApiPropertyOptional({
    description:
      'Traffic-aware travel time. Only populated when the Google Maps key ' +
      'supports the Distance Matrix Advanced feature. Null for ThreeWay journeys.',
    type: DistanceMatrixLegDto,
    nullable: true,
  })
  traffic_aware_duration?: DistanceMatrixLegDto | null;

  @ApiProperty({
    description: 'All active sub-services with pricing calculated for this journey',
    type: [PricedSubServiceDto],
  })
  sub_services: PricedSubServiceDto[];
}
