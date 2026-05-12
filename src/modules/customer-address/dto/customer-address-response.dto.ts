import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerAddressResponseDto {
  @ApiProperty({ description: 'Unique ID of the saved address', example: 1 })
  id: number;

  @ApiProperty({ description: 'Customer ID', example: 1 })
  customer_id: number;

  @ApiProperty({ description: 'Label for the address', example: 'Home' })
  label: string;

  @ApiProperty({ description: 'Is this the default address?', example: false })
  is_default: boolean;

  @ApiPropertyOptional({
    description: 'The original Google Maps place_id used to resolve this address',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  place_id?: string;

  @ApiPropertyOptional({ description: 'Full address string', example: '123 Main St, Anytown, USA' })
  address?: string;

  @ApiPropertyOptional({ description: 'Street name', example: 'Main St' })
  street?: string;

  @ApiPropertyOptional({ description: 'Area or locality', example: 'Downtown' })
  area?: string;

  @ApiPropertyOptional({ description: 'City name', example: 'Anytown' })
  city?: string;

  @ApiPropertyOptional({ description: 'State name', example: 'CA' })
  state?: string;

  @ApiPropertyOptional({ description: 'Pincode', example: '123456' })
  pincode?: string;

  @ApiPropertyOptional({ description: 'Country name', example: 'USA' })
  country?: string;

  @ApiProperty({ description: 'Latitude coordinate', example: 37.7749 })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate', example: -122.4194 })
  longitude: number;

  @ApiPropertyOptional({ description: 'Nearby landmark', example: 'Next to Central Park' })
  landmark?: string;

  @ApiPropertyOptional({ description: 'Additional description', example: 'Ring the bell twice' })
  description?: string;

  @ApiProperty({ description: 'Creation date' })
  created_at: Date;

  @ApiProperty({ description: 'Last update date' })
  updated_at: Date;
}
