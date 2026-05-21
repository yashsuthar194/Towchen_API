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

  @ApiProperty({ description: 'Fixed distance for the base price', example: 5, default: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fix_distance: number;

  @ApiProperty({ description: 'Fixed price for the base distance', example: 100, default: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fix_price: number;

  @ApiProperty({ description: 'Extra price per unit distance beyond fixed distance', example: 20, default: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  extra_price: number;

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

  @ApiPropertyOptional({ type: [String], example: ['Condition 1', 'Condition 2'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value.split(',').map((v) => v.trim()).filter(Boolean);
    }
    return value;
  })
  conditions?: string[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Image file for the sub-service preview',
  })
  image?: any;
}
