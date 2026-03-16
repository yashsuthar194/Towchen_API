import { IsString, IsNotEmpty, IsOptional, IsNumber, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDriverLocationDto {
  @ApiPropertyOptional({ description: 'Full address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Street name' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ description: 'Area or locality' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'City name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State name' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Pincode/Zipcode' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ description: 'Country name' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNotEmpty()
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNotEmpty()
  @IsNumber()
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ description: 'Nearby landmark' })
  @IsOptional()
  @IsString()
  landmark?: string;
}
