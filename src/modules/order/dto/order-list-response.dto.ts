import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, OrderType, LocationType } from '@prisma/client';

export class OrderLocationSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: LocationType })
  type: LocationType;

  @ApiPropertyOptional({ nullable: true })
  address?: string | null;

  @ApiPropertyOptional({ nullable: true })
  street?: string | null;

  @ApiPropertyOptional({ nullable: true })
  area?: string | null;

  @ApiPropertyOptional({ nullable: true })
  city?: string | null;

  @ApiPropertyOptional({ nullable: true })
  state?: string | null;

  @ApiPropertyOptional({ nullable: true })
  pincode?: string | null;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiPropertyOptional({ nullable: true })
  landmark?: string | null;

  @ApiProperty()
  place_id: string;

  @ApiPropertyOptional({ nullable: true })
  contact_name?: string | null;

  @ApiPropertyOptional({ nullable: true })
  contact_number?: string | null;
}

export class OrderCustomerSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  formated_id: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  number: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  average_rating?: number;
}

export class OrderCustomerVehicleSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  make: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  registration_number: string;

  @ApiPropertyOptional({ nullable: true })
  class?: string | null;

  @ApiPropertyOptional({ nullable: true })
  fuel_type?: string | null;

  @ApiPropertyOptional({ nullable: true })
  vehicle_type?: string | null;
}

export class OrderVendorSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  formated_id: string;

  @ApiProperty()
  vendor_name: string;

  @ApiProperty()
  organization_name: string;

  @ApiProperty()
  mobile_number: string;

  @ApiProperty()
  email: string;
}

export class OrderDriverSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  formated_id: string;

  @ApiProperty()
  driver_name: string;

  @ApiProperty()
  mobile_number: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  driver_image_url?: string | null;
}

export class OrderVehicleSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  registration_number: string;

  @ApiProperty()
  make: string;

  @ApiProperty()
  model: string;

  @ApiPropertyOptional({ nullable: true })
  fleet_type?: number | null;
}

export class OrderServiceSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class OrderSubServiceSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  journey_type?: string | null;
}

export class OrderListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  formated_id: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ enum: OrderType })
  type: OrderType;

  @ApiProperty({ description: 'ID of the sub-service (Fleet Type)' })
  fleet_type: number;

  @ApiProperty()
  customer_id: number;

  @ApiPropertyOptional({ nullable: true })
  vendor_id?: number | null;

  @ApiPropertyOptional({ nullable: true })
  driver_id?: number | null;

  @ApiPropertyOptional({ nullable: true })
  vehicle_id?: number | null;

  @ApiProperty()
  service_id: number;

  @ApiPropertyOptional({ nullable: true })
  sub_service_id?: number | null;

  @ApiPropertyOptional({ nullable: true })
  final_amount?: number | null;

  @ApiPropertyOptional({ default: 0 })
  discount_amount?: number;

  @ApiPropertyOptional({ nullable: true })
  applied_voucher_code?: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ nullable: true })
  assign_time?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  start_time?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  completion_time?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  remarks?: string | null;

  @ApiPropertyOptional({ nullable: true })
  cancel_reason?: string | null;

  @ApiPropertyOptional({ nullable: true })
  job_card_type?: string | null;

  @ApiPropertyOptional({ default: false })
  has_dispute: boolean;

  @ApiPropertyOptional({ type: () => OrderCustomerSummaryDto, nullable: true })
  customer?: OrderCustomerSummaryDto | null;

  @ApiPropertyOptional({ type: () => OrderCustomerVehicleSummaryDto, nullable: true })
  customer_vehicle?: OrderCustomerVehicleSummaryDto | null;

  @ApiPropertyOptional({ type: () => OrderVendorSummaryDto, nullable: true })
  vendor?: OrderVendorSummaryDto | null;

  @ApiPropertyOptional({ type: () => OrderDriverSummaryDto, nullable: true })
  driver?: OrderDriverSummaryDto | null;

  @ApiPropertyOptional({ type: () => OrderVehicleSummaryDto, nullable: true })
  vehicle?: OrderVehicleSummaryDto | null;

  @ApiProperty({ type: () => OrderServiceSummaryDto })
  service: OrderServiceSummaryDto;

  @ApiPropertyOptional({ type: () => OrderSubServiceSummaryDto, nullable: true })
  sub_service?: OrderSubServiceSummaryDto | null;

  @ApiPropertyOptional({ type: () => OrderLocationSummaryDto, nullable: true })
  breakdown_location?: OrderLocationSummaryDto | null;

  @ApiPropertyOptional({ type: () => OrderLocationSummaryDto, nullable: true })
  dropoff_location?: OrderLocationSummaryDto | null;

  @ApiProperty({ type: () => [OrderLocationSummaryDto] })
  locations: OrderLocationSummaryDto[];
}

export class OrderPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 5 })
  total_pages: number;
}

export class PaginatedOrderListResponseDto {
  @ApiProperty({ type: [OrderListItemDto] })
  items: OrderListItemDto[];

  @ApiProperty({ type: OrderPaginationMetaDto })
  pagination: OrderPaginationMetaDto;
}
