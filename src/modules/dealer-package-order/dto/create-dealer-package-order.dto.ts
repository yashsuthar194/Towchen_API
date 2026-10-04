import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FuelType, CarSegment, TransmissionType } from '@prisma/client';

export class CreateDealerPackageOrderDto {
  // --- CUSTOMER DETAILS ---
  @ApiProperty({ example: 'Rahul Sharma', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  customer_name: string;

  @ApiProperty({ example: '+919876543210', description: 'Customer primary mobile number' })
  @IsString()
  @IsNotEmpty({ message: 'Customer number is required' })
  customer_number: string;

  @ApiPropertyOptional({ example: '+919876543211', description: 'Customer alternative contact number' })
  @IsString()
  @IsOptional()
  alternative_number?: string;

  @ApiProperty({ example: 'rahul.sharma@example.com', description: 'Customer email address' })
  @IsEmail({}, { message: 'Invalid customer email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email_address: string;

  @ApiPropertyOptional({ example: 'Flat 402, Sunshine Heights', description: 'Building/Apartment name' })
  @IsString()
  @IsOptional()
  building?: string;

  @ApiPropertyOptional({ example: 'Wing B', description: 'Block / Wing' })
  @IsString()
  @IsOptional()
  block?: string;

  @ApiPropertyOptional({ example: 'MG Road', description: 'Road / Street name' })
  @IsString()
  @IsOptional()
  road?: string;

  @ApiProperty({ example: 'Mumbai', description: 'City' })
  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  city: string;

  @ApiProperty({ example: 'Maharashtra', description: 'State' })
  @IsString()
  @IsNotEmpty({ message: 'State is required' })
  state: string;

  @ApiProperty({ example: '400001', description: 'Pincode / Postal Code' })
  @IsString()
  @IsNotEmpty({ message: 'Pincode is required' })
  pincode: string;

  @ApiPropertyOptional({ example: '27AAAAA0000A1Z5', description: 'GSTIN (optional)' })
  @IsString()
  @IsOptional()
  gst_number?: string;

  // --- VEHICLE DETAILS ---
  @ApiProperty({ example: 'MH02AB1234', description: 'Vehicle registration number' })
  @IsString()
  @IsNotEmpty({ message: 'Vehicle registration number is required' })
  vehicle_reg_number: string;

  @ApiProperty({ example: 'Maruti Suzuki', description: 'Vehicle manufacturer / make' })
  @IsString()
  @IsNotEmpty({ message: 'Vehicle make is required' })
  vehicle_make: string;

  @ApiProperty({ example: 'Dzire', description: 'Vehicle model' })
  @IsString()
  @IsNotEmpty({ message: 'Vehicle model is required' })
  vehicle_model: string;

  @ApiProperty({ enum: FuelType, example: FuelType.Petrol, description: 'Fuel type' })
  @IsEnum(FuelType, { message: 'Invalid vehicle fuel type' })
  vehicle_fuel_type: FuelType;

  @ApiProperty({ enum: TransmissionType, example: TransmissionType.Manual, description: 'Transmission type' })
  @IsEnum(TransmissionType, { message: 'Invalid transmission type' })
  transmission_type: TransmissionType;

  @ApiProperty({ example: 2022, description: 'Vehicle registration year' })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  registration_year: number;

  @ApiProperty({ example: 'MA3EAA12S00123456', description: 'Chassis / VIN number' })
  @IsString()
  @IsNotEmpty({ message: 'Chassis number is required' })
  chassis_number: string;

  @ApiProperty({ example: 34500, description: 'Current odometer reading in kilometers' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  current_odometer_reading: number;

  @ApiProperty({ enum: CarSegment, example: CarSegment.Basic, description: 'Car segment: Basic, Standard, or Premium' })
  @IsEnum(CarSegment, { message: 'Car segment must be Basic, Standard, or Premium' })
  car_segment: CarSegment;

  // --- PACKAGE PLAN SELECTION ---
  @ApiProperty({ example: 1, description: 'Target dealer package plan ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  package_plan_id: number;

  @ApiProperty({ example: '2026-10-04', description: 'Package plan start date (YYYY-MM-DD or ISO string)' })
  @IsString()
  @IsNotEmpty({ message: 'Package plan start date is required' })
  package_plan_start_date: string;

  // --- GEO-TEMPORAL METADATA (JSON string from frontend) ---
  @ApiPropertyOptional({
    example: '{"latitude": 19.0760, "longitude": 72.8777, "captured_at": "2026-10-04T15:00:00.000Z"}',
    description: 'JSON metadata for 4-sided inspection images (lat, lng, captured_at)',
  })
  @IsString()
  @IsOptional()
  vehicle_images_meta?: string;

  @ApiPropertyOptional({
    example: '{"latitude": 19.0760, "longitude": 72.8777, "captured_at": "2026-10-04T15:00:00.000Z"}',
    description: 'JSON metadata for odometer inspection image (lat, lng, captured_at)',
  })
  @IsString()
  @IsOptional()
  odometer_image_meta?: string;
}
