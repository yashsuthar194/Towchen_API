import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EJobCardDamageDto {
  @ApiProperty({ description: 'The point number of the damage from the vehicle diagram', example: 1 })
  @IsNotEmpty()
  @IsInt()
  damage_number: number;

  @ApiProperty({ description: 'The image URL showing the damage', example: 'https://example.com/damage-1.jpg' })
  @IsNotEmpty()
  @IsString()
  image_url: string;
}

export class SubmitPickupJobCardDto {
  @ApiProperty({ description: 'Fuel amount (e.g. 50%)', example: '50%' })
  @IsNotEmpty()
  @IsString()
  fuel_amount: string;

  @ApiProperty({ description: 'Odometer reading text', example: '124500 km' })
  @IsNotEmpty()
  @IsString()
  odometer_reading_text: string;

  @ApiProperty({ description: 'Remarks/comments', example: 'Front bumper scratches noted.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ 
    type: 'string',
    description: 'A JSON string representing the selected accessories (e.g. {"Hub Caps": true, "Arial": false})', 
    example: '{"Hub Caps": true, "Arial": false}'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  selected_accessories?: Record<string, boolean>;

  @ApiProperty({ description: 'Vehicle Class Configuration ID', example: 1 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNotEmpty()
  @IsInt()
  vehicle_class_configuration_id: number;

  @ApiProperty({ 
    type: 'string',
    description: 'Comma separated string of damage point numbers corresponding to the uploaded damage images. (e.g. "1,5")', 
    example: '1,5' 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v));
    }
    return value;
  })
  @IsArray()
  @IsInt({ each: true })
  damage_numbers?: number[];

  @ApiProperty({ type: 'string', format: 'binary', description: 'Odometer Image (File)' })
  odometer_image: any;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Driver Image (File)' })
  driver_image: any;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Driver Signature (File)' })
  driver_sign: any;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'Damage Images (Files)' })
  damage_images: any[];
}
