import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderStatus, OrderType } from '@prisma/client';

export class AdminPackageOrderQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by client / dealer ID (client_id)' })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const val = value ?? obj?.dealer_id;
    return val !== undefined && val !== '' ? Number(val) : val;
  })
  @Type(() => Number)
  @IsInt()
  client_id?: number;

  @ApiPropertyOptional({ description: 'Alias for client_id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dealer_id?: number;

  @ApiPropertyOptional({ description: 'Filter by Towchen package membership ID (tp_membership_id)' })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const val = value ?? obj?.dealer_package_order_id ?? obj?.membership_id;
    return val !== undefined && val !== '' ? Number(val) : val;
  })
  @Type(() => Number)
  @IsInt()
  tp_membership_id?: number;

  @ApiPropertyOptional({ description: 'Alias for tp_membership_id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dealer_package_order_id?: number;

  @ApiPropertyOptional({ enum: OrderStatus, description: 'Filter by order status' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: OrderType, description: 'Filter by order type (Package, Sample)' })
  @IsOptional()
  @IsEnum(OrderType)
  order_type?: OrderType;

  @ApiPropertyOptional({
    description: 'Search by formatted ID, customer name, customer number, vehicle reg, or chassis',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
