import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Represents a single measurement leg (distance or duration) from the Google Distance Matrix API.
 */
export class DistanceMatrixLegDto {
  @ApiProperty({
    description: 'Raw numeric value (meters for distance, seconds for duration)',
    example: 15200,
  })
  raw_value: number;

  @ApiProperty({
    description: 'Human-readable formatted string as returned by Google',
    example: '15.2 km',
  })
  formatted: string;
}

/**
 * Parsed result from a single origin-destination pair from the Google Distance Matrix API.
 *
 * @remarks
 * `duration_in_traffic` is only populated when `departure_time: "now"` is set
 * and the Google Maps API key has the Distance Matrix (Advanced) feature enabled.
 */
export class DistanceMatrixResultDto {
  @ApiProperty({
    description: 'Real road distance between the two locations',
    type: DistanceMatrixLegDto,
  })
  distance: DistanceMatrixLegDto;

  @ApiProperty({
    description: 'Estimated travel time without traffic',
    type: DistanceMatrixLegDto,
  })
  travel_time: DistanceMatrixLegDto;

  @ApiPropertyOptional({
    description: 'Traffic-aware travel time (only when departure_time is set)',
    type: DistanceMatrixLegDto,
  })
  traffic_aware_duration?: DistanceMatrixLegDto;
}
