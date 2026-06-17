import { IsInt, IsNotEmpty, IsOptional, ValidateNested, IsString, IsObject, IsBoolean, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderLocationInputDto } from './order-location-input.dto';

export class CreateOrderDto {
  @ApiPropertyOptional({ description: 'Customer Vehicle ID' })
  @IsOptional()
  @IsInt()
  customer_vehicle_id?: number;

  @ApiProperty({ description: 'Service ID' })
  @IsNotEmpty()
  @IsInt()
  service_id: number;

  @ApiProperty({ description: 'Sub-Service ID (Fleet Type)' })
  @IsNotEmpty()
  @IsInt()
  sub_service_id: number;

  @ApiProperty({
    description: 'Breakdown location — send the place_id from address search predictions',
    type: OrderLocationInputDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OrderLocationInputDto)
  breakdown_location: OrderLocationInputDto;

  @ApiPropertyOptional({
    description: 'Drop location — send the place_id from address search predictions. Required only for FourWay journey sub-services.',
    type: OrderLocationInputDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderLocationInputDto)
  drop_location?: OrderLocationInputDto;

  @ApiPropertyOptional({ description: 'Breakdown Contact Name' })
  @IsOptional()
  @IsString()
  breakdown_contact_name?: string;

  @ApiPropertyOptional({ description: 'Breakdown Contact Number' })
  @IsOptional()
  @IsString()
  breakdown_contact_number?: string;

  @ApiPropertyOptional({ description: 'Drop Contact Name' })
  @IsOptional()
  @IsString()
  drop_contact_name?: string;

  @ApiPropertyOptional({ description: 'Drop Contact Number' })
  @IsOptional()
  @IsString()
  drop_contact_number?: string;

  @ApiPropertyOptional({ 
    description: 'Sub-service estimate details including formatted and raw pricing data. Passed directly from the estimate API response.'
  })
  @IsOptional()
  @IsObject()
  sub_service_estimate?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Optional referral/discount voucher code to apply' })
  @IsOptional()
  @IsString()
  voucher_code?: string;

  @ApiPropertyOptional({ description: 'Require physical job card at pickup', default: true })
  @IsOptional()
  @IsBoolean()
  isPhysicalJobCardForPickup?: boolean;

  @ApiPropertyOptional({ description: 'Require physical job card at dropoff', default: true })
  @IsOptional()
  @IsBoolean()
  isPhysicalJobCardForDropoff?: boolean;

  @ApiProperty({
    description: 'Exactly 4 pre-booked images are required from customer during order creation',
    type: [String],
    minItems: 4,
    maxItems: 4,
  })
  @IsArray()
  @ArrayMinSize(4, { message: 'Exactly 4 images are required' })
  @ArrayMaxSize(4, { message: 'Exactly 4 images are required' })
  @IsString({ each: true })
  pre_booked_images: string[];
}
