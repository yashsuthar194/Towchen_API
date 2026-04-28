import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DriverForgotPasswordOtpDto {
  @ApiProperty({ description: 'Driver ID (e.g., DRV001)', example: 'DRV001' })
  @IsNotEmpty()
  @IsString()
  formated_id: string;
}
