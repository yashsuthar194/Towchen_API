import { IsNotEmpty, IsNumber } from 'class-validator';

export class VendorAuthVerificationDto {
  @IsNumber()
  @IsNotEmpty()
  mobile_otp: number;

  @IsNumber()
  @IsNotEmpty()
  email_otp: number;
}
