import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class DriverVerificationDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'number must be a valid 10-digit Indian mobile number',
  })
  number?: string;

  @IsOptional()
  @IsString()
  formated_id?: string;

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
