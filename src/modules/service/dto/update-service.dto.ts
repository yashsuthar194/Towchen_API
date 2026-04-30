import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @ApiPropertyOptional({ description: 'Whether the service is active', example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
