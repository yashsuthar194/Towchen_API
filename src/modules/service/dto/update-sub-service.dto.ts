import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSubServiceDto } from './create-sub-service.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateSubServiceDto extends PartialType(CreateSubServiceDto) {
  @ApiPropertyOptional({ description: 'Whether the sub-service is active', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
