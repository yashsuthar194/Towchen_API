import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Input DTO for specifying a location when creating an order.
 *
 * @remarks
 * The frontend sends only the `place_id` selected from the address search predictions.
 * The backend resolves all address details (including latitude and longitude)
 * internally via the Maps service before saving to the database.
 *
 * Latitude and longitude are stored in the location table for future
 * use cases such as distance calculation between breakdown and drop points.
 */
export class OrderLocationInputDto {
  @ApiProperty({
    description:
      'Google Maps place_id from the selected address prediction. ' +
      'The backend resolves the full address details from this.',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  @IsNotEmpty({ message: 'place_id is required for each location' })
  @IsString()
  place_id: string;
}
