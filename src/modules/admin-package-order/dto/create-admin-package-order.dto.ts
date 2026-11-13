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

/**
 * DTO for POST /admin-package-order (Create Admin Package Order With MultiImage Upload)
 * Supports all 29 FlutterFlow variables plus optional address text, coordinates, and assignment fields.
 */
export class CreateAdminPackageOrderDto {
  // ─── Image 1: General Info & Dispatch ───────────────────────────────────────

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
    description: 'Sub-Service ID (e.g. 1 for Towing, Flatbed)',
  })
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : value))
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  sub_service_id: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['Cab', 'Hotel Accomodation'],
    description: 'Extra package services used in this order (Cab, Hotel Accomodation) - Is List: True',
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
    description: 'Dispatch type: Current (immediate) or ScheduledLater',
  })
  @IsEnum(DispatchType)
  @IsNotEmpty()
  dispatch_type: DispatchType;

  @ApiPropertyOptional({
    example: '2026-10-25T10:00:00.000Z',
    description: 'Scheduled activation time (mandatory if dispatch_type is ScheduledLater)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  activation_time?: string;

  @ApiPropertyOptional({
    example: '2026-10-25T11:30:00.000Z',
    description: 'Estimated time of arrival (eta)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  eta?: string;

  @ApiPropertyOptional({
    example: 'ChIJ...pickup_place_id',
    description: 'Google Place ID for breakdown/pickup location',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  pickup_place_id?: string;

  @ApiPropertyOptional({
    example: 'Dhanushdhari Farm, Pardhol, Gujarat 382330',
    description: 'Human-readable pickup location address (optional, prevents null if available)',
  })
  @IsOptional()
  @Transform(({ value, obj }) => (value ?? obj?.pickup_location ?? ''))
  @IsString()
  pickup_location_address?: string;

  @ApiPropertyOptional({
    example: 23.0225,
    description: 'Pickup latitude coordinate (optional, prevents null if available)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsNumber()
  pickup_latitude?: number;

  @ApiPropertyOptional({
    example: 72.5714,
    description: 'Pickup longitude coordinate (optional, prevents null if available)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsNumber()
  pickup_longitude?: number;

  // ─── Image 2: Drop Location, Client & Customer Info ─────────────────────────

  @ApiPropertyOptional({
    example: 'ChIJ...drop_place_id',
    description: 'Google Place ID for drop location (mandatory for FourWay sub-services)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  drop_place_id?: string;

  @ApiPropertyOptional({
    example: 'Samarpan Cricket Ground, Sonarda, Gujarat 382355',
    description: 'Human-readable drop location address (optional, prevents null if available)',
  })
  @IsOptional()
  @Transform(({ value, obj }) => (value ?? obj?.drop_location ?? ''))
  @IsString()
  drop_location_address?: string;

  @ApiPropertyOptional({
    example: 23.033,
    description: 'Drop latitude coordinate (optional, prevents null if available)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsNumber()
  drop_latitude?: number;

  @ApiPropertyOptional({
    example: 72.585,
    description: 'Drop longitude coordinate (optional, prevents null if available)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsNumber()
  drop_longitude?: number;

  @ApiProperty({
    enum: ClientType,
    example: ClientType.Dealer,
    description: 'Client type: Dealer',
  })
  @IsEnum(ClientType)
  @IsNotEmpty()
  client_type: ClientType;

  @ApiProperty({
    example: 1,
    description: 'Dealer ID (client_id)',
  })
  @Transform(({ value, obj }) => {
    const val = value ?? obj?.dealer_id;
    return val !== undefined && val !== '' ? Number(val) : val;
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  client_id: number;

  @ApiProperty({
    example: 10,
    description: 'Towchen Package Membership ID (Contract ID: tp_membership_id)',
  })
  @Transform(({ value, obj }) => {
    const val = value ?? obj?.membership_id ?? obj?.dealer_package_order_id;
    return val !== undefined && val !== '' ? Number(val) : val;
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  tp_membership_id: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Dealer Customer ID (optional, auto-resolved from package contract if omitted)',
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : value))
  @Type(() => Number)
  @IsInt()
  dealer_customer_id?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Read-only field from form for available service incidents',
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : value))
  @Type(() => Number)
  @IsInt()
  available_service_incidents?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Read-only field from form for available cab incidents',
  })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== '' ? Number(value) : value))
  @Type(() => Number)
  @IsInt()
  available_cab_incidents?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Read-only field from form for available hotel accomodation incidents (spelled as in form)',
  })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const val = value ?? obj?.available_hotel_accommodation_incidents;
    return val !== undefined && val !== '' ? Number(val) : value;
  })
  @Type(() => Number)
  @IsInt()
  available_hotel_accomodation_incidents?: number;

  @ApiProperty({
    example: 'Jainish Panchal',
    description: 'Customer full name (customer)',
  })
  @Transform(({ value, obj }) => {
    const val = value ?? obj?.customer_name;
    if (typeof val === 'object' && val !== null) {
      return (val.customer || val.customer_name || val.name || '').trim();
    }
    return (val ?? '').trim();
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customer: string;

  @ApiProperty({
    example: '+919016616324',
    description: 'Customer primary mobile number (customer_number)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  customer_number: string;

  @ApiPropertyOptional({
    example: '+918866459232',
    description: 'Customer alternate mobile number (customer_alternate_number)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(20)
  customer_alternate_number?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Dealer Customer Vehicle ID (vehicle_id)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @Type(() => Number)
  @IsInt()
  vehicle_id?: number;

  @ApiProperty({
    example: 'TATA',
    description: 'Vehicle make / brand (vehicle_make)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  vehicle_make: string;

  // ─── Image 3: Vehicle Specs, Status, Upload & Access Token ──────────────────

  @ApiProperty({
    example: 'Altroz',
    description: 'Vehicle model (vehicle_model)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  vehicle_model: string;

  @ApiPropertyOptional({
    example: 'Dark Smart AT',
    description: 'Vehicle variant (vehicle_variant)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(100)
  vehicle_variant?: string;

  @ApiProperty({
    enum: FuelType,
    example: FuelType.Diesel,
    description: 'Vehicle fuel type: Petrol, Diesel, CNG, Electric, Hybrid (vehicle_fuel_type)',
  })
  @IsEnum(FuelType)
  @IsNotEmpty()
  vehicle_fuel_type: FuelType;

  @ApiPropertyOptional({
    example: 'Hatchback',
    description: 'Vehicle body type (vehicle_body_type)',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(100)
  vehicle_body_type?: string;

  @ApiProperty({
    example: 'GJ01HA9667',
    description: 'Vehicle registration plate number (vehicle_registration_number)',
  })
  @Transform(({ value, obj }) => (value ?? obj?.vehicle_reg_number ?? '').trim().toUpperCase())
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  vehicle_registration_number: string;

  @ApiProperty({
    example: 'MB28431SDSD45153',
    description: 'Vehicle chassis VIN number (vehicle_chassis_number)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  vehicle_chassis_number: string;

  @ApiProperty({
    enum: VehicleCurrentStatus,
    example: VehicleCurrentStatus.AtHouse,
    description:
      'Where vehicle currently is (AtHouse, Roadside, Dealership, Workshop, Office, Other) - Is List: True in FlutterFlow',
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value[0] || VehicleCurrentStatus.AtHouse;
    }
    return value || VehicleCurrentStatus.AtHouse;
  })
  @IsEnum(VehicleCurrentStatus)
  @IsNotEmpty()
  vehicle_current_status: VehicleCurrentStatus;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Vehicle intake photos / condition images (upload_images - Uploaded File, Is List: True)',
  })
  @IsOptional()
  upload_images?: any;

  @ApiPropertyOptional({
    example: 'Vehicle battery drained and tyre flat.',
    description: 'Vehicle problem / customer issue remarks (vehicle_problem)',
  })
  @IsOptional()
  @Transform(({ value, obj }) => (value ?? obj?.remarks ?? ''))
  @IsString()
  @MaxLength(1000)
  vehicle_problem?: string;

  @ApiPropertyOptional({
    description: 'FlutterFlow authorization access token parameter (access_token)',
  })
  @IsOptional()
  @IsString()
  access_token?: string;

  // ─── Optional Assignment Fields (Prevents null if pre-assigned) ─────────────

  @ApiPropertyOptional({
    example: 2,
    description: 'Pre-assigned Vendor ID (optional)',
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
}
