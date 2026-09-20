import { IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderOtpType } from '@prisma/client';

export class SendLeadOtpDto {
  @ApiProperty({ enum: OrderOtpType, example: 'BREAKDOWN' })
  @IsNotEmpty()
  @IsEnum(OrderOtpType)
  type: OrderOtpType;
}

export class SendLeadOrderOtpDto extends SendLeadOtpDto {}
