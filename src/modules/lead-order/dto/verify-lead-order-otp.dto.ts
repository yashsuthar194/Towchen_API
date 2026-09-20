import { IsNotEmpty, IsEnum, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderOtpType } from '@prisma/client';

export class VerifyLeadOtpDto {
  @ApiProperty({ enum: OrderOtpType, example: 'BREAKDOWN' })
  @IsNotEmpty()
  @IsEnum(OrderOtpType)
  type: OrderOtpType;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;
}

export class VerifyLeadOrderOtpDto extends VerifyLeadOtpDto {}
