import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateVoucherDto {
  @ApiProperty({
    description: 'Voucher code to validate',
    example: 'TOW-123456',
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}
