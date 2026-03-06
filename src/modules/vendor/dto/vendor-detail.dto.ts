import { ApiProperty } from '@nestjs/swagger';
import { VendorServices, VendorStatus } from '@prisma/client';
import { VendorBankDetailDto } from '../../vendor-bank-detail/dto/vendor-bank-detail.dto';

export class VendorDetailDto {
  id: number;
  formated_id: string;
  full_name: string;
  email: string;
  number: string;
  alternate_number: string;
  is_email_verified: boolean;
  vendor_image_url: string;
  is_gst_vendor: boolean;

  pan_card_url: string;
  adhar_card_url: string;
  org_name: string;
  org_number: string;
  org_certificate_url: string;
  org_email: string;
  gst_number: string;
  gst_certificate_url: string;
  approved_by: number | null;
  created_at: Date;
  updated_at: Date;

  @ApiProperty({
    enum: Object.values(VendorServices),
    example: [VendorServices.ROS],
  })
  services: VendorServices[];
  @ApiProperty({
    enum: Object.values(VendorStatus),
    example: VendorStatus.Pending,
  })
  status: VendorStatus;

  bank_detail: VendorBankDetailDto | null;
}
