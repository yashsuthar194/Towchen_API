import { IsEmail, IsNotEmpty } from 'class-validator';

export class DriverVerificationRequestDto {
  @IsNotEmpty()
  number: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
