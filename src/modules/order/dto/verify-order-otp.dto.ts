import { IsNotEmpty, IsEnum, IsString, Length, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderOtpType } from '@prisma/client';

export class VerifyOrderOtpDto {
  @ApiProperty({ enum: OrderOtpType, example: 'START' })
  @IsNotEmpty()
  @IsEnum(OrderOtpType)
  type: OrderOtpType;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ type: [String], required: false, description: 'Optional pre-pickup or post-pickup images' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
