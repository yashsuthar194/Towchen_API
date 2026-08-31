import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Length,
  ValidateIf,
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

  @ValidateIf((o, val) => val !== '000000')
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'email_otp must be a 6-digit OTP' })
  email_otp: string;

  @ValidateIf((o, val) => val !== '000000')
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'number_otp must be a 6-digit OTP' })
  number_otp: string;
}
