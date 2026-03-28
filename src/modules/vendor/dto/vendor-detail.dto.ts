import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType, VendorServices, VendorStatus } from '@prisma/client';
import { VendorBankDetailDto } from '../../vendor-bank-detail/dto/vendor-bank-detail.dto';

/**
 * Response DTO for vendor detail endpoints.
 */
export class VendorDetailDto {
  id: number;
  formated_id: string;
  vendor_name: string;
  email: string;
  mobile_number: string;
  alternate_number: string;
  is_email_verified: boolean;
  vendor_profile_image_url: string;

  pan_card_url: string;
  aadhar_card_url: string;
  organization_name: string;
  organization_certificate_url: string;

  @ApiProperty({
    enum: Object.values(OrganizationType),
    example: OrganizationType.SoleProprietorship,
  })
  organization_type: OrganizationType;

  gst_number: string | null;
  gst_certificate_url: string;

  /** Whether the vendor is GST-registered. Derived from gst_number. */
  @ApiProperty({ type: Boolean, example: true })
  is_gst_vendor: boolean;

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
