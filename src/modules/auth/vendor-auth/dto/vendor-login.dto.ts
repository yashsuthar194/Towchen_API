import { IsNotEmpty, IsString } from 'class-validator';

export class VendorLoginDto {
  @IsString()
  @IsNotEmpty()
  formated_id: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
