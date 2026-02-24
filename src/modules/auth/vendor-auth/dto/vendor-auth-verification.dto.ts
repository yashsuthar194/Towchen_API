import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class VendorAuthVerificationDto {
  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsNumber()
  @IsNotEmpty()
  mobile_otp: number;

  @IsNumber()
  @IsNotEmpty()
  email_otp: number;
}
