import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { DealerPackageStatus, PackagePaymentStatus } from '@prisma/client';

export class DealerPackageOrderQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Items per page limit' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'MH02', description: 'Search keyword (customer name, vehicle reg, order number)' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: DealerPackageStatus, description: 'Filter by package status' })
  @IsEnum(DealerPackageStatus)
  @IsOptional()
  status?: DealerPackageStatus;

  @ApiPropertyOptional({ enum: PackagePaymentStatus, description: 'Filter by payment status' })
  @IsEnum(PackagePaymentStatus)
  @IsOptional()
  payment_status?: PackagePaymentStatus;
}
