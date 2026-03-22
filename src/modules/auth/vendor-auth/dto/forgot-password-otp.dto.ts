import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * Request body for sending a forgot-password OTP.
 * The vendor must supply their registered mobile number.
 */
export class ForgotPasswordOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'number must be a valid 10-digit Indian mobile number',
  })
  number: string;
}
