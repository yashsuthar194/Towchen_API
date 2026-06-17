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

  @ApiProperty({ description: 'Date & Time', required: false })
  @IsOptional()
  @IsString()
  date_and_time?: string;

  @ApiProperty({ description: 'Order ID', required: false })
  @IsOptional()
  @IsString()
  order_id?: string;

  @ApiProperty({ description: 'Service Type', required: false })
  @IsOptional()
  @IsString()
  service_type?: string;

  @ApiProperty({ description: 'Vehicle Brand', required: false })
  @IsOptional()
  @IsString()
  vehicle_brand?: string;

  @ApiProperty({ description: 'Vehicle Model', required: false })
  @IsOptional()
  @IsString()
  vehicle_model?: string;

  @ApiProperty({ description: 'Vehicle No.', required: false })
  @IsOptional()
  @IsString()
  vehicle_no?: string;

  @ApiProperty({ description: 'Customer Ph. No.', required: false })
  @IsOptional()
  @IsString()
  customer_ph_no?: string;

  @ApiProperty({ description: 'Driver Name', required: false })
  @IsOptional()
  @IsString()
  driver_name?: string;

  @ApiProperty({ description: 'Driver Ph. No.', required: false })
  @IsOptional()
  @IsString()
  driver_ph_no?: string;

  @ApiProperty({ description: 'Reaching Date & Time', required: false })
  @IsOptional()
  @IsString()
  reaching_date_and_time?: string;

  @ApiProperty({ description: 'Event Type', required: false })
  @IsOptional()
  @IsString()
  event_type?: string;

  @ApiProperty({ description: 'Event Location', required: false })
  @IsOptional()
  @IsString()
  event_location?: string;

  @ApiProperty({ description: 'Time of day (e.g. Day, Night)', required: false, example: 'Day' })
  @IsOptional()
  @IsString()
  time_of_day?: string;

  @ApiProperty({ description: 'Weather condition (e.g. Wet, Dry)', required: false, example: 'Wet' })
  @IsOptional()
  @IsString()
  weather_condition?: string;

  @ApiProperty({ description: 'Vehicle condition (e.g. Clean, Soiled)', required: false, example: 'Clean' })
  @IsOptional()
  @IsString()
  vehicle_condition?: string;

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
