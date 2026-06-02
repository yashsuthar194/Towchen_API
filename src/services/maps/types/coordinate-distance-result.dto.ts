import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DistanceMatrixLegDto } from './distance-matrix-result.dto';

/**
 * Result for a single origin in a coordinate-based Distance Matrix request.
 *
 * @remarks
 * `status` mirrors the Google Distance Matrix element status.
 * When status is not `OK`, `distance` and `travel_time` will be null.
 * `traffic_aware_duration` is only present on premium API keys.
 */
export class CoordinateDistanceResultDto {
  @ApiProperty({
    description: 'Google Distance Matrix element status for this origin',
    example: 'OK',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Real road distance from this origin to the destination',
    type: DistanceMatrixLegDto,
  })
  distance?: DistanceMatrixLegDto | null;

  @ApiPropertyOptional({
    description: 'Estimated travel time without traffic',
    type: DistanceMatrixLegDto,
  })
  travel_time?: DistanceMatrixLegDto | null;

  @ApiPropertyOptional({
    description: 'Traffic-aware travel time (requires premium API key)',
    type: DistanceMatrixLegDto,
  })
  traffic_aware_duration?: DistanceMatrixLegDto | null;
}
