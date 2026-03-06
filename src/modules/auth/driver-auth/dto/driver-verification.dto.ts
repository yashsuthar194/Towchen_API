import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class DriverVerificationDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'number must be a valid 10-digit Indian mobile number',
  })
  number: string;

  @IsNotEmpty()
  @IsInt()
  @Min(100000, { message: 'email_otp must be a 6-digit OTP' })
  @Max(999999, { message: 'email_otp must be a 6-digit OTP' })
  email_otp: number;

  @IsNotEmpty()
  @IsInt()
  @Min(100000, { message: 'number_otp must be a 6-digit OTP' })
  @Max(999999, { message: 'number_otp must be a 6-digit OTP' })
  number_otp: number;
}
