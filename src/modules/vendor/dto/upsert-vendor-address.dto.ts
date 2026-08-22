import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating or updating a vendor's physical office address.
 */
export class UpsertVendorAddressDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The Google Maps place_id selected by the vendor',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  place_id: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Optional landmark to help locate the office',
    example: 'Near Central Station',
  })
  landmark?: string;
}
