import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CustomerOtpVerificationDto {
    @ApiProperty({ example: '9876543210', description: 'Mobile number of the customer' })
    @IsNotEmpty()
    @IsString()
    number: string;

    @ApiProperty({ example: '123456', description: 'OTP sent to the mobile number' })
    @IsNotEmpty()
    @IsString()
    otp: string;
}
