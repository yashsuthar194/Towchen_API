import { IsNotEmpty, IsString, IsInt, Min, IsArray, ArrayMinSize, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleClassConfigDto {
  @ApiProperty({
    description: 'The mapped standard vehicle class (e.g. Car, Bike, Riksaw)',
    example: 'Car',
  })
  @IsNotEmpty()
  @IsString()
  mapped_class: string;

  @ApiProperty({
    description: 'An array of sub-classes associated with this standard class (e.g. ["SUV", "LMV", "SEDAN", "HATCHBACK"]) or comma-separated string',
    example: ['SUV', 'LMV', 'SEDAN', 'HATCHBACK'],
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
      return value.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
    }
    return value;
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  sub_classes: string[];

  @ApiProperty({
    description: 'An array of accessories associated with this standard class (e.g. ["Hub Caps", "Arial", "Spare Wheels"])',
    example: ['Hub Caps', 'Arial', 'Spare Wheels'],
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
      return value.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
    }
    return value;
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accessories?: string[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The diagram image file',
    required: false,
  })
  @IsOptional()
  file?: any;

  @ApiProperty({
    description: 'The total number of damage points available on this diagram',
    example: 25,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  total_damage_points: number;
}
