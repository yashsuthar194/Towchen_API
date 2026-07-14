import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsInt, IsBoolean, IsNumber, IsIn } from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EVCRFAccessoryInputDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'Tool kit' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Yes', enum: ['Yes', 'No'] })
  @IsString()
  @IsIn(['Yes', 'No'])
  value: string;
}

export class EVCRFConditionInputDto {
  @IsNumber()
  group_id: number;

  @IsString()
  group_name: string;

  @IsNumber()
  selected_option_id: number;

  @IsString()
  selected_option_name: string;
}

export class EVCRFDamageDto {
  @ApiProperty({ description: 'The point number of the damage from the vehicle diagram', example: 1 })
  @IsNotEmpty()
  @IsInt()
  damage_number: number;

  @ApiProperty({ description: 'The image URL showing the damage', example: 'https://example.com/damage-1.jpg' })
  @IsNotEmpty()
  @IsString()
  image_url: string;
}

export class SubmitPickupEvcrfDto {
  @ApiProperty({ description: 'Fuel amount (e.g. 50%)', example: '50%' })
  @IsOptional()
  @IsString()
  fuel_amount?: string;

  @ApiProperty({ description: 'Odometer reading text', example: '124500 km', required: false })
  @IsOptional()
  @IsString()
  odometer_reading_text?: string;

  @ApiProperty({ description: 'Remarks/comments', example: 'Front bumper scratches noted.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ 
    type: () => [EVCRFAccessoryInputDto],
    description: 'A JSON string representing the selected accessories (e.g. [{"id":1,"name":"Tool kit","value":"Yes"}])', 
    example: '[{"id":1,"name":"Tool kit","value":"Yes"}]'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if(parsed) {
          return plainToInstance(EVCRFAccessoryInputDto, parsed);
        } else {
          return []
        }
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EVCRFAccessoryInputDto)
  selected_accessories?: EVCRFAccessoryInputDto[];

  @ApiProperty({ description: 'Vehicle Class Configuration ID', example: 1 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNotEmpty()
  @IsInt()
  vehicle_class_configuration_id: number;

  @ApiProperty({
    description: 'JSON array of selected dynamic conditions',
    type: [EVCRFConditionInputDto],
    example: '[{"group_id": 1, "group_name": "Weather", "selected_option_id": 2, "selected_option_name": "Wet"}]'
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (parsed && Array.isArray(parsed)) return parsed;
      } catch (e) {
        return []
      }
    }
    return value ?? [];
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EVCRFConditionInputDto)
  vehicle_state?: EVCRFConditionInputDto[];

  @ApiProperty({ type: 'string', format: 'binary', description: 'Odometer Image (File)', required: false })
  odometer_image?: any;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Driver Image (File)', required: false })
  driver_image?: any;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Driver Signature (File)', required: false })
  driver_sign?: any;
}
