import { IsEmail, IsInt, IsNotEmpty, Max, Min } from 'class-validator';

/**
 * Request body for verifying the forgot-password OTP.
 * The vendor must supply the same mobile number and the 6-digit OTP
 * that was sent via SMS in the previous step.
 */
export class ForgotPasswordVerifyDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsInt()
  @IsNotEmpty()
  @Min(100000, { message: 'mobile_otp must be a 6-digit OTP' })
  @Max(999999, { message: 'mobile_otp must be a 6-digit OTP' })
  otp: number;
}
