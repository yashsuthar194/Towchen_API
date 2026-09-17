import { IsNotEmpty, IsEnum, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderOtpType } from '@prisma/client';

export class SendLeadOrderOtpDto {
  @ApiProperty({ enum: OrderOtpType, example: 'BREAKDOWN' })
  @IsNotEmpty()
  @IsEnum(OrderOtpType)
  type: OrderOtpType;
}
