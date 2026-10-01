import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber } from 'class-validator';

export class ReverseGeocodeDto {
  @ApiProperty({
    description: 'Latitude coordinate of the location',
    example: 19.076,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  lat: number;

  @ApiProperty({
    description: 'Longitude coordinate of the location',
    example: 72.8777,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  lng: number;
}
