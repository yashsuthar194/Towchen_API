import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, LocationType, OrderOtpType } from '@prisma/client';
import { ServiceDto, SubServiceDto } from '../../vendor/dto/service.dto';
import { CustomerDetailDto, CustomerVehicleDetailDto } from '../../customer/dto/customer-detail.dto';

class OrderLocationDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  place_id: string;
  place_id: string;

  @ApiProperty({ enum: LocationType })
  type: LocationType;

  @ApiPropertyOptional()
  contact_name?: string;

  @ApiPropertyOptional()
  contact_number?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  street?: string;

  @ApiPropertyOptional()
  area?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  pincode?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiPropertyOptional()
  landmark?: string;
}

export class OrderOtpDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  order_id: number;

  @ApiProperty({ enum: OrderOtpType })
  type: OrderOtpType;

  @ApiProperty()
  otp: string;

  @ApiProperty()
  expires_at: Date;

  @ApiPropertyOptional({ nullable: true })
  verified_at?: Date | null;

  @ApiProperty()
  is_verified: boolean;
}

export class OrderDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  formated_id: string;

  @ApiProperty()
  customer_id: number;

  @ApiPropertyOptional({ nullable: true })
  customer_vehicle_id?: number | null;

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

  @ApiProperty({ type: ServiceDto })
  service: ServiceDto;

  @ApiPropertyOptional({ type: SubServiceDto, nullable: true })
  sub_service?: SubServiceDto | null;

  @ApiProperty({ description: 'ID of the sub-service (Fleet Type)' })
  fleet_type: number;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiPropertyOptional({ nullable: true })
  remarks?: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ type: [OrderLocationDetailDto] })
  locations: OrderLocationDetailDto[];

  @ApiPropertyOptional({ description: 'Order metadata (JSON) containing nested sub_service estimate details' })
  meta_data?: any;

  @ApiPropertyOptional({ type: () => CustomerDetailDto })
  customer?: CustomerDetailDto;

  @ApiPropertyOptional({ type: () => CustomerVehicleDetailDto })
  customer_vehicle?: CustomerVehicleDetailDto;

  @ApiPropertyOptional({ type: () => OrderLocationDetailDto })
  breakdown_location?: OrderLocationDetailDto;

  @ApiPropertyOptional({ type: () => OrderLocationDetailDto })
  dropoff_location?: OrderLocationDetailDto;
}
