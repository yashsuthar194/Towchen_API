import { IsEmail, IsString } from 'class-validator';

export class VendorLoginDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
