import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ClientType,
  DispatchType,
  FuelType,
  OrderStatus,
  OrderType,
  VehicleCurrentStatus,
} from '@prisma/client';

export class AdminPackageOrderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'APO0000001' })
  formated_id: string;

  @ApiProperty({ enum: OrderType, example: OrderType.Package })
  order_type: OrderType;

  @ApiProperty({ example: 1 })
  sub_service_id: number;

  @ApiProperty({ enum: DispatchType, example: DispatchType.Current })
  dispatch_type: DispatchType;

  @ApiPropertyOptional({ example: null })
  activation_time?: Date;

  @ApiPropertyOptional({ example: null })
  eta?: Date;

  @ApiProperty({ enum: ClientType, example: ClientType.Dealer })
  client_type: ClientType;

  @ApiProperty({ example: 1 })
  dealer_id: number;

  @ApiProperty({ example: 10 })
  dealer_package_order_id: number;

  @ApiProperty({ example: 5 })
  dealer_customer_id: number;

  @ApiProperty({ example: 'Jainish Panchal' })
  customer_name: string;

  @ApiProperty({ example: '+919016616324' })
  customer_number: string;

  @ApiPropertyOptional({ example: '+918866459232' })
  customer_alternate_number?: string;

  @ApiPropertyOptional({ example: 3 })
  vehicle_id?: number;

  @ApiProperty({ example: 'TATA' })
  vehicle_make: string;

  @ApiProperty({ example: 'Altroz' })
  vehicle_model: string;

  @ApiPropertyOptional({ example: 'Dark Smart AT' })
  vehicle_variant?: string;

  @ApiProperty({ enum: FuelType, example: FuelType.Diesel })
  vehicle_fuel_type: FuelType;

  @ApiPropertyOptional({ example: 'Sports Utility Vehicle' })
  vehicle_body_type?: string;

  @ApiProperty({ example: 'GJ01HA9667' })
  vehicle_reg_number: string;

  @ApiProperty({ example: 'MB28431SDSD45153' })
  vehicle_chassis_number: string;

  @ApiProperty({ enum: VehicleCurrentStatus, example: VehicleCurrentStatus.AtHouse })
  vehicle_current_status: VehicleCurrentStatus;

  @ApiProperty({ example: ['https://storage.example.com/image1.jpg'] })
  images: string[];

  @ApiProperty({ example: ['Cab', 'Hotel Accomodation'] })
  extra_services: string[];

  @ApiPropertyOptional({ example: 'Dhanushdhari Farm, Pardhol, Gujarat 382330' })
  pickup_location_address?: string;

  @ApiPropertyOptional({ example: 23.0225 })
  pickup_latitude?: number;

  @ApiPropertyOptional({ example: 72.5714 })
  pickup_longitude?: number;

  @ApiPropertyOptional({ example: 'ChIJ...pickup_place_id' })
  pickup_place_id?: string;

  @ApiPropertyOptional({ example: 'Samarpan Cricket Ground, Sonarda, Gujarat 382355' })
  drop_location_address?: string;

  @ApiPropertyOptional({ example: 23.033 })
  drop_latitude?: number;

  @ApiPropertyOptional({ example: 72.585 })
  drop_longitude?: number;

  @ApiPropertyOptional({ example: 'ChIJ...drop_place_id' })
  drop_place_id?: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.New })
  status: OrderStatus;

  @ApiPropertyOptional({ example: null })
  vendor_id?: number;

  @ApiPropertyOptional({ example: null })
  driver_id?: number;

  @ApiPropertyOptional({ example: null })
  assigned_vehicle_id?: number;

  @ApiPropertyOptional({ example: null })
  assign_time?: Date;

  @ApiPropertyOptional({ example: null })
  start_time?: Date;

  @ApiPropertyOptional({ example: null })
  completion_time?: Date;

  @ApiPropertyOptional({ example: null })
  remarks?: string;

  @ApiPropertyOptional({ example: null })
  cancel_reason?: string;

  @ApiPropertyOptional({ example: 1 })
  created_by_id?: number;

  @ApiProperty({ example: '2026-10-21T10:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-10-21T10:00:00.000Z' })
  updated_at: Date;
}

export class AdminPackageOrderListResponseDto {
  @ApiProperty({ type: [AdminPackageOrderResponseDto] })
  items: AdminPackageOrderResponseDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 10,
      total: 25,
      total_pages: 3,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
