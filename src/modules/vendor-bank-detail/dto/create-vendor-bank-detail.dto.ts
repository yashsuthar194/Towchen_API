import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateVendorBankDetailDto {
  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{9,18}$/, {
    message: 'account_number must be a valid bank account number (9-18 digits)',
  })
  account_number: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/i, {
    message: 'ifsc_code must be a valid IFSC code (e.g. SBIN0001234)',
  })
  ifsc_code: string;

  @IsString()
  @IsNotEmpty()
  branch_name: string;

  @IsString()
  @IsNotEmpty()
  account_holder_name: string;
}
