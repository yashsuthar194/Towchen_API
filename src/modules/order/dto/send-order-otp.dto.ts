import { IsNotEmpty, IsEnum, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderOtpType } from '@prisma/client';

export class SendOrderOtpDto {
  @ApiProperty({ enum: OrderOtpType, example: 'START' })
  @IsNotEmpty()
  @IsEnum(OrderOtpType)
  type: OrderOtpType;
}
