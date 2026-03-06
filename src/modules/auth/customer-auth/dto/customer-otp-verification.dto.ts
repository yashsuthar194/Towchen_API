import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CustomerOtpVerificationDto {
  @ApiProperty({
    example: '9876543210',
    description: 'Mobile number of the customer',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'number must be a valid 10-digit Indian mobile number',
  })
  number: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP sent to the mobile number',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp must be a 6-digit number' })
  otp: string;
}
