import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  ConsentEntityType,
  ConsentStatus,
  ConsentStep,
} from '@prisma/client';

export class ConsentQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination (starts at 1)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of records per page (max 100)',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: ConsentStatus,
    description: 'Filter by current consent status',
    example: ConsentStatus.PendingApproval,
  })
  @IsOptional()
  @IsEnum(ConsentStatus)
  status?: ConsentStatus;

  @ApiPropertyOptional({
    enum: ConsentStep,
    description: 'Filter by current active step in the workflow',
    example: ConsentStep.Approval,
  })
  @IsOptional()
  @IsEnum(ConsentStep)
  current_step?: ConsentStep;

  @ApiPropertyOptional({
    enum: ConsentEntityType,
    description: 'Filter by entity type (OrderEdit, VendorOnboarding, etc.)',
    example: ConsentEntityType.OrderEdit,
  })
  @IsOptional()
  @IsEnum(ConsentEntityType)
  entity_type?: ConsentEntityType;

  @ApiPropertyOptional({
    description: 'Filter by related entity numeric ID (e.g. order_id)',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entity_id?: number;
}
