import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatus, OrderType } from '@prisma/client';
import { OrderDateFilterField } from './admin-order-filter.dto';
import {
  emptyToBoolean,
  emptyToNumber,
  emptyToUndefined,
} from 'src/core/utils/dto-transform.util';

export class VendorOrderFilterDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number for pagination' })
  @IsOptional()
  @Transform(emptyToNumber)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 30, default: 30, description: 'Number of records per page (optional, default: 30)' })
  @IsOptional()
  @Transform(emptyToNumber)
  @IsInt()
  @Min(1)
  limit?: number = 30;

  @ApiPropertyOptional({
    description: 'Filter by single order status',
    enum: OrderStatus,
    example: OrderStatus.New,
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filter by single order type',
    enum: OrderType,
    example: OrderType.Standard,
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(OrderType)
  type?: OrderType;

  @ApiPropertyOptional({ description: 'Filter by assigned driver ID (must belong to vendor)', example: 12 })
  @IsOptional()
  @Transform(emptyToNumber)
  @IsInt()
  driver_id?: number;

  @ApiPropertyOptional({ description: 'Filter by assigned vehicle ID (must belong to vendor)', example: 8 })
  @IsOptional()
  @Transform(emptyToNumber)
  @IsInt()
  vehicle_id?: number;

  @ApiPropertyOptional({ description: 'Filter by service ID', example: 1 })
  @IsOptional()
  @Transform(emptyToNumber)
  @IsInt()
  service_id?: number;

  @ApiPropertyOptional({ description: 'Filter by sub-service ID', example: 2 })
  @IsOptional()
  @Transform(emptyToNumber)
  @IsInt()
  sub_service_id?: number;

  @ApiPropertyOptional({
    description: 'Field to apply date range filter against',
    enum: OrderDateFilterField,
    default: OrderDateFilterField.CREATED_AT,
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEnum(OrderDateFilterField)
  date_filter_by?: OrderDateFilterField = OrderDateFilterField.CREATED_AT;

  @ApiPropertyOptional({ description: 'Start date in ISO format (e.g. 2026-01-01)', example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date in ISO format (e.g. 2026-12-31)', example: '2026-12-31T23:59:59.999Z' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Filter by city (breakdown or drop location)', example: 'Mumbai' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by state', example: 'Maharashtra' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by pincode', example: '400001' })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ description: 'Minimum final order amount', example: 500 })
  @IsOptional()
  @Transform(emptyToNumber)
  @IsNumber()
  min_amount?: number;

  @ApiPropertyOptional({ description: 'Maximum final order amount', example: 5000 })
  @IsOptional()
  @Transform(emptyToNumber)
  @IsNumber()
  max_amount?: number;

  @ApiPropertyOptional({ description: 'Filter orders that have an active dispute', example: true })
  @IsOptional()
  @Transform(emptyToBoolean)
  @IsBoolean()
  has_dispute?: boolean;

  @ApiPropertyOptional({
    description:
      'Search key: searches Order ID (e.g. "ORD-10023", 10023), Vehicle Number (e.g. "MH01AB1234" or "MH 01"), customer name/phone, driver, or location',
    example: 'ORD-10023',
  })
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  search?: string;
}
