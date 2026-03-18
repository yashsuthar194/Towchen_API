import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, VendorServices, FleetType, LocationType } from '@prisma/client';

class OrderLocationDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  location_id: number;

  @ApiProperty({ enum: LocationType })
  type: LocationType;

  @ApiProperty()
  location: any; // Simplified for now, or use LocationDetailDto if available

  @ApiPropertyOptional()
  contact_name?: string;

  @ApiPropertyOptional()
  contact_number?: string;
}

export class OrderDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  formated_id: string;

  @ApiProperty()
  customer_id: number;

  @ApiPropertyOptional()
  customer_vehicle_id?: number;

  @ApiPropertyOptional()
  vendor_id?: number;

  @ApiPropertyOptional()
  driver_id?: number;

  @ApiPropertyOptional()
  vehicle_id?: number;

  @ApiProperty({ enum: VendorServices })
  service_type: VendorServices;

  @ApiProperty({ enum: FleetType })
  fleet_type: FleetType;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiPropertyOptional()
  remarks?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ type: [OrderLocationDetailDto] })
  locations: OrderLocationDetailDto[];
}
