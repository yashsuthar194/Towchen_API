import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class OrderEditPayloadDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Updated order status',
    example: OrderStatus.InProgress,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'General administrative remarks or notes for the order',
    example: 'Route altered due to severe road block',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Cancellation reason if marking the order as Cancelled',
    example: 'Customer requested cancellation at breakdown site',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancel_reason?: string;

  @ApiPropertyOptional({
    description: 'Updated discount amount in currency units',
    example: 150.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_amount?: number;

  @ApiPropertyOptional({
    description: 'Updated final billing amount after discounts and adjustments',
    example: 1850.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  final_amount?: number;

  @ApiPropertyOptional({
    description: 'Assigned Driver ID',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  driver_id?: number;

  @ApiPropertyOptional({
    description: 'Assigned Vehicle ID',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  vehicle_id?: number;

  @ApiPropertyOptional({
    description: 'Assigned Vendor ID',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  vendor_id?: number;

  @ApiPropertyOptional({
    description: 'Service ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  service_id?: number;

  @ApiPropertyOptional({
    description: 'Sub-Service ID',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  sub_service_id?: number;

  @ApiPropertyOptional({
    description: 'Fleet Type ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  fleet_type?: number;

  @ApiPropertyOptional({
    description: 'Flag indicating whether physical VCRF was used for pickup',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_physical_vcrf_for_pickup?: boolean;

  @ApiPropertyOptional({
    description: 'Flag indicating whether physical VCRF was used for dropoff',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_physical_vcrf_for_dropoff?: boolean;
}
