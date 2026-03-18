import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, VendorServices, FleetType } from '@prisma/client';

export class OrderListDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  formated_id: string;

  @ApiProperty()
  customer_id: number;

  @ApiProperty({ enum: VendorServices })
  service_type: VendorServices;

  @ApiProperty({ enum: FleetType })
  fleet_type: FleetType;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  created_at: Date;
}
