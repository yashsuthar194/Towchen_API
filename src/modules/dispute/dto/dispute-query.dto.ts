import {
  IsEnum,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DisputeStatus, DisputeType } from '@prisma/client';

export class DisputeQueryDto {
  @ApiPropertyOptional({ description: 'Page number (default: 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page (default: 10)', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: DisputeStatus,
    description: 'Filter by current status (PendingResolution, PendingVerification, etc.)',
  })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @ApiPropertyOptional({
    enum: DisputeType,
    description: 'Filter by dispute type (TollDispute, KmDispute, etc.)',
  })
  @IsOptional()
  @IsEnum(DisputeType)
  dispute_type?: DisputeType;

  @ApiPropertyOptional({ description: 'Filter by Order ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order_id?: number;

  @ApiPropertyOptional({ description: 'Filter by Vendor ID (Admin only)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vendor_id?: number;
}
