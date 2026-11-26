import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { CarSegment } from '@prisma/client';

export class DealerPackagePlanQueryDto {
  @ApiPropertyOptional({ enum: CarSegment, description: 'Optional car segment to resolve applicable pricing (Basic/Gold, Standard/Platinum, Premium/Diamond)' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'gold' || lower === 'basic') return CarSegment.Basic;
      if (lower === 'platinum' || lower === 'standard') return CarSegment.Standard;
      if (lower === 'diamond' || lower === 'premium') return CarSegment.Premium;
    }
    return value;
  })
  @IsEnum(CarSegment)
  @IsOptional()
  segment?: CarSegment;
}
