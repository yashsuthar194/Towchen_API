import { IsEmail, IsNotEmpty } from 'class-validator';

export class DriverVerificationDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  number: string;

  @IsNotEmpty()
  email_otp: number;

  @IsNotEmpty()
  number_otp: number;
}
