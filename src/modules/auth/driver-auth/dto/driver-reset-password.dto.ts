import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DriverResetPasswordDto {
  @ApiProperty({ description: 'Driver ID (e.g., DRV001)', example: 'DRV001' })
  @IsNotEmpty()
  @IsString()
  formated_id: string;

  @ApiProperty({ description: 'OTP received via SMS', example: '123456' })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({ description: 'New password', example: 'newPassword123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  new_password: string;
}
