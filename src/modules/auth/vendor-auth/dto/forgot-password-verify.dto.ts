import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

/**
 * Request body for verifying the forgot-password OTP.
 * The vendor must supply the same mobile number and the 6-digit OTP
 * that was sent via SMS in the previous step.
 */
export class ForgotPasswordVerifyDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Number must be a valid 10-digit Indian mobile number',
  })
  number: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'OTP must contain only digits' })
  otp: string;
}
