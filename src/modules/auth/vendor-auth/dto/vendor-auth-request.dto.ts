import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class VendorAuthRequestDto {
  @IsString()
  @IsNotEmpty()
  number: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
