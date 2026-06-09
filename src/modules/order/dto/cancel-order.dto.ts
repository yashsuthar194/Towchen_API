import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({ example: 'Vehicle breakdown', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
