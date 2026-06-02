import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveAddressDto {
  @ApiProperty({
    description: 'The Google Maps place_id obtained from frontend autocomplete',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  @IsNotEmpty()
  @IsString()
  place_id: string;
}
