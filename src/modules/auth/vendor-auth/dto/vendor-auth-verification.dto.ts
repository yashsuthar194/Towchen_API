import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class VendorAuthVerificationDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'number must be a valid 10-digit Indian mobile number',
  })
  number: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ValidateIf((o, val) => val !== 0 && val !== '000000')
  @IsInt()
  @IsNotEmpty()
  @Min(100000, { message: 'mobile_otp must be a 6-digit OTP' })
  @Max(999999, { message: 'mobile_otp must be a 6-digit OTP' })
  mobile_otp: number;

  @ValidateIf((o, val) => val !== 0 && val !== '000000')
  @IsInt()
  @IsNotEmpty()
  @Min(100000, { message: 'email_otp must be a 6-digit OTP' })
  @Max(999999, { message: 'email_otp must be a 6-digit OTP' })
  email_otp: number;
}
