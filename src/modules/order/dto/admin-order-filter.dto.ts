import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderStatus, OrderType } from '@prisma/client';

export enum OrderDateFilterField {
  CREATED_AT = 'created_at',
  ASSIGN_TIME = 'assign_time',
  START_TIME = 'start_time',
  COMPLETION_TIME = 'completion_time',
}

export class AdminOrderFilterDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 30, default: 30, description: 'Number of records per page (optional, default: 30)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 30;

  @ApiPropertyOptional({
    description: 'Filter by single order status',
    enum: OrderStatus,
    example: OrderStatus.New,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filter by single order type',
    enum: OrderType,
    example: OrderType.Standard,
  })
  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @ApiPropertyOptional({ description: 'Filter by specific vendor ID', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vendor_id?: number;

  @ApiPropertyOptional({ description: 'Filter by specific driver ID', example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  driver_id?: number;

  @ApiPropertyOptional({ description: 'Filter by specific customer ID', example: 42 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  customer_id?: number;

  @ApiPropertyOptional({ description: 'Filter by assigned vehicle ID', example: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicle_id?: number;

  @ApiPropertyOptional({ description: 'Filter by service ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  service_id?: number;

  @ApiPropertyOptional({ description: 'Filter by sub-service ID', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sub_service_id?: number;

  @ApiPropertyOptional({
    description: 'Field to apply date range filter against',
    enum: OrderDateFilterField,
    default: OrderDateFilterField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(OrderDateFilterField)
  date_filter_by?: OrderDateFilterField = OrderDateFilterField.CREATED_AT;

  @ApiPropertyOptional({ description: 'Start date in ISO format (e.g. 2026-01-01)', example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date in ISO format (e.g. 2026-12-31)', example: '2026-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Filter by city (breakdown or drop location)', example: 'Mumbai' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by state', example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by pincode', example: '400001' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ description: 'Minimum final order amount', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min_amount?: number;

  @ApiPropertyOptional({ description: 'Maximum final order amount', example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  max_amount?: number;

  @ApiPropertyOptional({ description: 'Filter orders that have an active dispute', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  has_dispute?: boolean;

  @ApiPropertyOptional({ description: 'Filter orders where a discount voucher was applied', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  has_voucher?: boolean;

  @ApiPropertyOptional({
    description:
      'Search key: searches Order ID (e.g. "ORD-10023", 10023), Vehicle Number (e.g. "MH01AB1234" or "MH 01"), customer name/phone, driver, or location',
    example: 'ORD-10023',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
