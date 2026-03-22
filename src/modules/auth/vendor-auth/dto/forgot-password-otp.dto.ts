import { IsNotEmpty, IsEmail } from 'class-validator';

/**
 * Request body for sending a forgot-password OTP.
 * The vendor must supply their registered mobile number.
 */
export class ForgotPasswordOtpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
