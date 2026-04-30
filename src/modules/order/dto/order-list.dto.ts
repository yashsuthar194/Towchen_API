import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { ServiceDto, SubServiceDto } from '../../vendor/dto/service.dto';

export class OrderListDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  formated_id: string;

  @ApiProperty()
  customer_id: number;

  @ApiProperty()
  service_id: number;

  @ApiProperty({ type: ServiceDto })
  service: ServiceDto;

  @ApiProperty({ type: SubServiceDto, required: false, nullable: true })
  sub_service?: SubServiceDto | null;

  @ApiProperty({ description: 'ID of the sub-service (Fleet Type)' })
  fleet_type: number;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  created_at: Date;
}
