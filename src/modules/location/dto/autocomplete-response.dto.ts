import { ApiProperty } from '@nestjs/swagger';

export class AutocompletePredictionDto {
  @ApiProperty({ description: 'The unique ID of the place' })
  place_id: string;

  @ApiProperty({ description: 'Human-readable address or description' })
  description: string;

  @ApiProperty({ description: 'Main text of the prediction (e.g. "Sector 1")' })
  main_text: string;

  @ApiProperty({ description: 'Secondary text of the prediction (e.g. "Gandhinagar, Gujarat")' })
  secondary_text: string;
}
