import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DealerPackageStatus, PackagePaymentStatus } from '@prisma/client';

export class UpdatePackageUsageDto {
  @ApiPropertyOptional({ example: 1, description: 'Number of breakdown incidents used so far' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  incidents_used?: number;

  @ApiPropertyOptional({ example: 1, description: 'Number of hotel accommodation stays used so far' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  hotel_accommodation_used?: number;

  @ApiPropertyOptional({ example: 1, description: 'Number of cab rides used so far' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  cab_service_used?: number;

  @ApiPropertyOptional({ example: 'Hotel accommodation approved for Pune breakdown on 04-Oct.', description: 'Admin operational notes' })
  @IsString()
  @IsOptional()
  admin_notes?: string;

  @ApiPropertyOptional({ enum: DealerPackageStatus, description: 'Package status' })
  @IsEnum(DealerPackageStatus)
  @IsOptional()
  status?: DealerPackageStatus;

  @ApiPropertyOptional({ enum: PackagePaymentStatus, description: 'Payment settlement status' })
  @IsEnum(PackagePaymentStatus)
  @IsOptional()
  payment_status?: PackagePaymentStatus;
}
