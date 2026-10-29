import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  ClientType,
  DispatchType,
  FuelType,
  OrderType,
  VehicleCurrentStatus,
} from '@prisma/client';

export class CreateAdminPackageOrderDto {
  // ─── 1. General Info ────────────────────────────────────────────────────────

  @ApiProperty({
    enum: OrderType,
    example: OrderType.Package,
    description: 'Order type: Package or Sample',
  })
  @IsEnum(OrderType)
  @IsNotEmpty()
  order_type: OrderType;

  @ApiProperty({
    example: 1,
    description: 'Sub-Service ID (e.g. Towing, Flatbed)',
  })
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : value))
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  sub_service_id: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['Cab', 'Hotel Accomodation'],
    description: 'Extra package services used in this order (Cab, Hotel Accomodation)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          return JSON.parse(trimmed);
        } catch {
          // fallback to comma separated
        }
      }
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  })
  @IsArray()
  @IsString({ each: true })
  extra_services?: string[];

  @ApiProperty({
    enum: DispatchType,
    example: DispatchType.Current,
    description: 'Current (immediate) or ScheduledLater',
  })
  @IsEnum(DispatchType)
  @IsNotEmpty()
  dispatch_type: DispatchType;

  @ApiPropertyOptional({
    example: '2026-10-25T10:00:00.000Z',
    description: 'Mandatory if dispatch_type is ScheduledLater',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  activation_time?: string;

  @ApiPropertyOptional({
    example: '2026-10-25T11:30:00.000Z',
    description: 'Estimated time of arrival / dispatch',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  eta?: string;

  // ─── 2. Personal Info / Client & Contract ───────────────────────────────────

  @ApiProperty({
    enum: ClientType,
    example: ClientType.Dealer,
    description: 'Client type (Dealer)',
  })
  @IsEnum(ClientType)
  @IsNotEmpty()
  client_type: ClientType;

  @ApiProperty({
    example: 1,
    description: 'Selected Dealer ID',
  })
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : value))
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  dealer_id: number;

  @ApiProperty({
    example: 10,
    description: 'Selected Dealer Package Order (Contract) ID',
  })
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : value))
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  dealer_package_order_id: number;

  @ApiProperty({
    example: 5,
    description: 'Dealer Customer ID',
  })
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : value))
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  dealer_customer_id: number;

  @ApiProperty({
    example: 'Jainish Panchal',
    description: 'Customer full name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customer_name: string;

  @ApiProperty({
    example: '+919016616324',
    description: 'Primary customer phone number',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  customer_number: string;

  @ApiPropertyOptional({
    example: '+918866459232',
    description: 'Alternative customer phone number',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(20)
  customer_alternate_number?: string;

  // ─── 3. Customer Vehicle Info ──────────────────────────────────────────────

  @ApiPropertyOptional({
    example: 3,
    description: 'Dealer Customer Vehicle ID',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsInt()
  vehicle_id?: number;

  @ApiProperty({
    example: 'TATA',
    description: 'Vehicle make / brand',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  vehicle_make: string;

  @ApiProperty({
    example: 'Altroz',
    description: 'Vehicle model',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  vehicle_model: string;

  @ApiPropertyOptional({
    example: 'Dark Smart AT',
    description: 'Vehicle variant',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(100)
  vehicle_variant?: string;

  @ApiProperty({
    enum: FuelType,
    example: FuelType.Diesel,
    description: 'Vehicle fuel type',
  })
  @IsEnum(FuelType)
  @IsNotEmpty()
  vehicle_fuel_type: FuelType;

  @ApiPropertyOptional({
    example: 'Sports Utility Vehicle',
    description: 'Vehicle body type',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(100)
  vehicle_body_type?: string;

  @ApiProperty({
    example: 'GJ01HA9667',
    description: 'Vehicle registration number',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  vehicle_reg_number: string;

  @ApiProperty({
    example: 'MB28431SDSD45153',
    description: 'Vehicle chassis number',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  vehicle_chassis_number: string;

  @ApiProperty({
    enum: VehicleCurrentStatus,
    example: VehicleCurrentStatus.AtHouse,
    description: 'Where the vehicle currently is (AtHouse, Roadside, Dealership, Workshop, Office, Other)',
  })
  @IsEnum(VehicleCurrentStatus)
  @IsNotEmpty()
  vehicle_current_status: VehicleCurrentStatus;

  // ─── 4. Customer Location Info ─────────────────────────────────────────────

  @ApiPropertyOptional({
    example: 'Dhanushdhari Farm, Pardhol, Gujarat 382330',
    description: 'Pickup / Breakdown location address',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  pickup_location_address?: string;

  @ApiPropertyOptional({ example: 23.0225 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsNumber()
  pickup_latitude?: number;

  @ApiPropertyOptional({ example: 72.5714 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsNumber()
  pickup_longitude?: number;

  @ApiPropertyOptional({ example: 'ChIJ...pickup_place_id' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  pickup_place_id?: string;

  @ApiPropertyOptional({
    example: 'Samarpan Cricket Ground, Sonarda, Gujarat 382355',
    description: 'Drop location address (Mandatory for FourWay journey sub-services)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  drop_location_address?: string;

  @ApiPropertyOptional({ example: 23.033 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsNumber()
  drop_latitude?: number;

  @ApiPropertyOptional({ example: 72.585 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsNumber()
  drop_longitude?: number;

  @ApiPropertyOptional({ example: 'ChIJ...drop_place_id' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  drop_place_id?: string;

  // ─── 5. Optional Pre-Assignment (for Scheduled / Pre-arranged Orders) ──────

  @ApiPropertyOptional({
    example: 2,
    description: 'Pre-assigned Vendor ID (optional, e.g. for pre-arranged scheduled towing)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsInt()
  vendor_id?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Pre-assigned Driver ID (optional)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsInt()
  driver_id?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Pre-assigned Fleet Vehicle ID (optional)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsInt()
  assigned_vehicle_id?: number;

  @ApiPropertyOptional({
    example: 'Urgent towing needed, vehicle battery flat and tyre puncture.',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
