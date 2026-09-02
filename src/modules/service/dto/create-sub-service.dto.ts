import { IsNotEmpty, IsString, IsInt, IsNumber, IsOptional, Min, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { JourneyType } from '@prisma/client';

export class CreateSubServiceDto {
  @ApiProperty({ description: 'Name of the sub-service', example: 'Flatbed Towing' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'ID of the parent service', example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  service_id: number;

  @ApiProperty({ description: 'Base distance for the base price', example: 5, default: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  base_distance: number;

  @ApiProperty({ description: 'Base price for the base distance', example: 100, default: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  base_price: number;

  @ApiProperty({ description: 'Extra price per unit distance beyond base distance', example: 20, default: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  extra_distance_price: number;

  @ApiProperty({ description: 'Weight capacity in tons', example: 1.5, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ton?: number;

  @ApiPropertyOptional({ enum: JourneyType, default: JourneyType.FourWay })
  @IsOptional()
  @IsEnum(JourneyType)
  journey_type?: JourneyType;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Image file for the sub-service preview',
  })
  image?: any;
}
