import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class DriverVerificationRequestDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'number must be a valid 10-digit Indian mobile number',
  })
  number: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
