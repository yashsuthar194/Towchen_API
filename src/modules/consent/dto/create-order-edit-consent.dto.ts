import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderEditPayloadDto } from './order-edit-payload.dto';

export class CreateOrderEditConsentDto {
  @ApiProperty({
    description: 'Numeric ID of the order to edit',
    example: 42,
  })
  @IsInt()
  @IsNotEmpty()
  order_id: number;

  @ApiProperty({
    description: 'Brief title or summary of why this consent edit is being requested',
    example: 'Apply 15% VIP discount and update dropoff remarks',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed explanation or business justification for the order change',
    example: 'Customer experienced service delay due to tire puncture on tow truck. Agreed to offer compensation discount.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'The proposed field updates to apply to the order once permission is granted',
    type: OrderEditPayloadDto,
  })
  @ValidateNested()
  @Type(() => OrderEditPayloadDto)
  @IsNotEmpty()
  changes: OrderEditPayloadDto;
}
