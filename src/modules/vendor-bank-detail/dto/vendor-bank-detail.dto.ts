import { vendor_bank_detail } from '@prisma/client';

export class VendorBankDetailDto implements vendor_bank_detail {
  id: number;
  vendor_id: number;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
  account_holder_name: string;
  passbook_or_cancel_check_url: string;

  created_at: Date;
  updated_at: Date;
}
