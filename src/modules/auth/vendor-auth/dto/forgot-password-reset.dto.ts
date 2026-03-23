import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

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

  @IsInt()
  @IsNotEmpty()
  @Min(100000, { message: 'mobile_otp must be a 6-digit OTP' })
  @Max(999999, { message: 'mobile_otp must be a 6-digit OTP' })
  otp: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  new_password: string;
}
