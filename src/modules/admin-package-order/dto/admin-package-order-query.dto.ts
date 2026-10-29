import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
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

  @ApiPropertyOptional({ description: 'Filter by dealer ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dealer_id?: number;

  @ApiPropertyOptional({ description: 'Filter by dealer package order ID' })
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
