import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CarSegment } from '@prisma/client';

export class DealerPackagePlanQueryDto {
  @ApiPropertyOptional({ enum: CarSegment, description: 'Optional car segment to resolve applicable pricing' })
  @IsEnum(CarSegment)
  @IsOptional()
  segment?: CarSegment;
}
