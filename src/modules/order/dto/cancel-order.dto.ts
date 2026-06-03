import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ description: 'Reason for cancelling the order', example: 'Customer requested cancellation' })
  @IsString()
  @IsNotEmpty()
  cancel_reason: string;
}
