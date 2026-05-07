import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Represents a single address prediction returned from a map provider's autocomplete API.
 *
 * @remarks
 * Step 1 of the address flow.
 * The frontend displays these as a dropdown list.
 * When the user selects one, its `place_id` is passed to the order API.
 * The backend will call `resolveAddressByPlaceIdAsync` internally to get full details.
 */
export class AddressPredictionDto {
  @ApiProperty({
    description: 'Unique Google Maps place identifier. Send this in the order payload.',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  place_id: string;

  @ApiProperty({
    description: 'Full human-readable description of the place',
    example: 'Sector 1, Gandhinagar, Gujarat, India',
  })
  description: string;

  @ApiProperty({
    description: 'Primary text of the prediction (place name or street)',
    example: 'Sector 1',
  })
  main_text: string;

  @ApiProperty({
    description: 'Secondary text of the prediction (city, state, country)',
    example: 'Gandhinagar, Gujarat, India',
  })
  secondary_text: string;

  @ApiProperty({
    description: 'Place type tags from Google Maps (e.g. sublocality, locality, route, establishment)',
    example: ['sublocality', 'political'],
    type: [String],
  })
  types: string[];
}
