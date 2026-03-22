import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType, VendorServices, VendorStatus } from '@prisma/client';
import { VendorBankDetailDto } from '../../vendor-bank-detail/dto/vendor-bank-detail.dto';

/**
 * Response DTO for vendor detail endpoints.
 *
 * NOTE: `is_gst_vendor` is intentionally typed as `boolean[]` (a single-element
 * array) in the API response so that consumers can distinguish a present-false
 * value from an absent field. The underlying DB column remains a plain boolean;
 * the wrap happens in the service layer.
 *
 * NOT using `implements Partial<VendorDto>` here because we deliberately change
 * the type of `is_gst_vendor` from `boolean` to `boolean[]`.
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

  gst_number: string;
  gst_certificate_url: string;

  /**
   * The GST-vendor flag wrapped in a single-element boolean array.
   * e.g. `[true]` or `[false]`.
   * The underlying DB column is a plain `boolean`.
   */
  @ApiProperty({ type: [String], example: ['true'] })
  is_gst_vendor: string[];

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
