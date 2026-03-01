import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVendorBankDetailDto {
  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @IsString()
  @IsNotEmpty()
  account_number: string;

  @IsString()
  @IsNotEmpty()
  ifsc_code: string;

  @IsString()
  @IsNotEmpty()
  branch_name: string;

  @IsString()
  @IsNotEmpty()
  account_holder_name: string;
}
