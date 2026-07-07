import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsInt, IsBoolean, IsNumber } from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EJobCardAccessoryInputDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'Tool kit' })
  @IsString()
  name: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  value: boolean;
}

export class EJobCardConditionInputDto {
  @IsNumber()
  group_id: number;

  @IsString()
  group_name: string;

  @IsNumber()
  selected_option_id: number;

  @IsString()
  selected_option_name: string;
}


export class SubmitPickupJobCardDto {
  @ApiProperty({ description: 'Fuel amount (e.g. 50%)', example: '50%', required: false })
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
    type: () => [EJobCardAccessoryInputDto],
    description: 'A JSON string representing the selected accessories (e.g. [{"id":1,"name":"Tool kit","value":true}])', 
    example: '[{"id":1,"name":"Tool kit","value":true}]'
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(EJobCardAccessoryInputDto, parsed);
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EJobCardAccessoryInputDto)
  selected_accessories?: EJobCardAccessoryInputDto[];

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
    description: 'JSON array of selected dynamic conditions',
    type: 'string',
    example: '[{"group_id": 1, "group_name": "Weather", "selected_option_id": 2, "selected_option_name": "Wet"}]'
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return value;
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EJobCardConditionInputDto)
  selected_conditions?: EJobCardConditionInputDto[];

  @ApiProperty({ type: 'string', format: 'binary', description: 'Odometer Image (File)', required: false })
  odometer_image?: any;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Driver Image (File)', required: false })
  driver_image?: any;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Driver Signature (File)', required: false })
  driver_sign?: any;
}
