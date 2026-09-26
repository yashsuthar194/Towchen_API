import { IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BookLeadDto {
  @ApiPropertyOptional({
    description: 'Optional ID of the customer vehicle to associate with this booking. If omitted, uses the customer\'s default registered vehicle.',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  customer_vehicle_id?: number;
}
