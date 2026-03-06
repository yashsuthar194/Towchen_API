import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VendorLoginDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
