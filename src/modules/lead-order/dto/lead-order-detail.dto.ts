import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, LeadStatus } from '@prisma/client';

export class LeadOrderDetailDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'LED0000001' })
  formated_id: string;

  @ApiPropertyOptional({ example: 'LDO0000001', nullable: true })
  order_formated_id?: string | null;

  @ApiProperty({ enum: LeadStatus })
  status: LeadStatus;

  @ApiPropertyOptional({ enum: OrderStatus, nullable: true })
  order_status?: OrderStatus | null;

  @ApiProperty({ example: 500 })
  lead_amount: number;

  @ApiPropertyOptional({ example: '10 km' })
  distance?: string;

  @ApiPropertyOptional({ example: '30 mins' })
  time?: string;

  @ApiProperty({ example: 'Pickup address' })
  start_location: string;

  @ApiProperty({ example: 'Dropoff address' })
  end_location: string;

  @ApiPropertyOptional({ nullable: true })
  start_location_data?: any;

  @ApiPropertyOptional({ nullable: true })
  end_location_data?: any;

  @ApiPropertyOptional({ example: true })
  is_physical_vcrf_for_pickup: boolean;

  @ApiPropertyOptional({ example: true })
  is_physical_vcrf_for_dropoff: boolean;

  @ApiPropertyOptional({ example: 'https://storage.../pickup.jpg', nullable: true })
  physical_pickup_vcrf_image?: string | null;

  @ApiPropertyOptional({ example: 'https://storage.../dropoff.jpg', nullable: true })
  physical_dropoff_vcrf_image?: string | null;

  @ApiPropertyOptional({ description: 'Job card type used at pickup', example: 'VCRF', enum: ['VCRF', 'EVCRF'], nullable: true })
  job_card_type?: string | null;

  @ApiPropertyOptional({ description: 'Job card type used at pickup', example: 'VCRF', enum: ['VCRF', 'EVCRF'], nullable: true })
  pickup_job_card_type?: string | null;

  @ApiPropertyOptional({ description: 'Job card type used at dropoff', example: 'VCRF', enum: ['VCRF', 'EVCRF'], nullable: true })
  dropoff_job_card_type?: string | null;

  @ApiPropertyOptional()
  customer?: any;

  @ApiPropertyOptional()
  driver?: any;

  @ApiPropertyOptional()
  vendor?: any;

  @ApiPropertyOptional()
  vehicle?: any;

  @ApiPropertyOptional()
  sub_service?: any;

  @ApiPropertyOptional()
  pickup_evcrf?: any;

  @ApiPropertyOptional()
  dropoff_evcrf?: any;
}
