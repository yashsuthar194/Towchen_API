import { IsEmail, IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';

/**
 * Request body for resetting the vendor's password.
 *
 * The OTP is re-submitted here to confirm the session without needing
 * any stateful token — the server verifies it again before updating
 * the password.
 */
export class ForgotPasswordResetDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otp: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  new_password: string;
}
