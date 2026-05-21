import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

/**
 * Request body for the order estimate endpoint.
 *
 * @remarks
 * Both place_ids come from Step 1 of the address flow (search-address).
 * The backend resolves them to full address + coordinates internally.
 */
export class OrderEstimateBodyDto {
  @ApiProperty({
    description:
      'Google Maps place_id for the breakdown (pickup) location. ' +
      'Obtain from GET /location/search-address.',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  @IsNotEmpty()
  @IsString()
  breakdown_place_id: string;

  @ApiPropertyOptional({
    description:
      'Google Maps place_id for the drop-off (destination) location. ' +
      'Obtain from GET /location/search-address. Optional for ThreeWay journeys.',
    example: 'ChIJLU7jZClu5kcR4PcOOO6p5I0',
  })
  @IsOptional()
  @IsString()
  dropoff_place_id?: string;
}
