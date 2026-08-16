import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** DTO for creating a new ServiceArea location via Google Place ID. */
export class CreateServiceLocationDto {
  @ApiProperty({
    example: 'Naroda',
    description: 'Human-readable name shown to vendors during registration',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'ChIJv6IvMQEDDTkRxABw1XMp4co',
    description: 'Google Place ID — backend resolves lat/lng and address automatically',
  })
  @IsNotEmpty()
  @IsString()
  place_id: string;
}
