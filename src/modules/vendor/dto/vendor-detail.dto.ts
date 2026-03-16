import { ApiProperty } from '@nestjs/swagger';
import { VendorServices, VendorStatus } from '@prisma/client';
import { VendorBankDetailDto } from '../../vendor-bank-detail/dto/vendor-bank-detail.dto';
import { VendorDto } from './vendor.dto';

export class VendorDetailDto implements Partial<VendorDto> {
  id: number;
  formated_id: string;
  vendor_name: string;
  email: string;
  mobile_number: string;
  alternate_number: string;
  is_email_verified: boolean;
  vendor_profile_image_url: string;
  is_gst_vendor: boolean;
  is_a_gst_vendor: "Yes" | "No";

  pan_card_url: string;
  aadhar_card_url: string;
  organization_name: string;
  organization_certificate_url: string;
  gst_number: string;
  gst_certificate_url: string;
  approved_by: number | null;
  created_at: Date;
  updated_at: Date;

  @ApiProperty({
    enum: Object.values(VendorServices),
    example: [VendorServices.Towing],
  })
  services: VendorServices[];

  @ApiProperty({
    enum: Object.values(VendorStatus),
    example: VendorStatus.Pending,
  })
  status: VendorStatus;

  bank_detail: VendorBankDetailDto | null;
}
