import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationCategory } from '@prisma/client';

export class CreateDriverLocationDto {
  @ApiProperty({
    description: 'Google Maps place_id for the location. This will be used to fetch all geographical and address details.',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  @IsNotEmpty()
  @IsString()
  place_id: string;

  @ApiPropertyOptional({ 
    description: 'Additional description or notes for this location (e.g., "Main Garage", "North Entry")',
    example: 'Main Garage'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category of the location',
    enum: LocationCategory,
    default: LocationCategory.Driver,
  })
  @IsOptional()
  @IsEnum(LocationCategory)
  category?: LocationCategory;
}
