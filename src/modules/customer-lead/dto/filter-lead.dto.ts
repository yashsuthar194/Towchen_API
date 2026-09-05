import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterLeadDto {
  @ApiPropertyOptional({ description: 'Filter leads by start location place_id' })
  @IsOptional()
  @IsString()
  start_location?: string;

  @ApiPropertyOptional({ description: 'Filter leads by end location place_id' })
  @IsOptional()
  @IsString()
  end_location?: string;
}
