import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType, VendorStatus } from '@prisma/client';
import { ServiceDto } from './service.dto';
import { VendorBankDetailDto } from '../../vendor-bank-detail/dto/vendor-bank-detail.dto';
import { VehicleDetailDto } from '../../vehicle/dto/vehicle-detail.dto';

/**
 * Response DTO for vendor detail endpoints.
 */
export class VendorDetailDto {
  id: number;

  @ApiProperty({ example: 'VEN-0001' })
  formated_id: string;

  vendor_name: string;
  email: string;
  mobile_number: string;
  alternate_number: string;
  is_email_verified: boolean;
  vendor_profile_image_url: string;

  pan_card_url: string;
  aadhar_card_url: string;

  @ApiProperty({ example: 'Acme Towing Services' })
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
    type: ServiceDto,
    isArray: true,
  })
  services: ServiceDto[];

  @ApiProperty({
    enum: Object.values(VendorStatus),
    example: VendorStatus.Pending,
  })
  status: VendorStatus;

  signature_url: string | null;

  bank_detail: VendorBankDetailDto | null;

  @ApiProperty({
    type: VehicleDetailDto,
    isArray: true,
  })
  vehicles: VehicleDetailDto[];

  @ApiProperty({ example: 102 })
  total_orders?: number;

  @ApiProperty({ example: 22 })
  total_leads?: number;

  @ApiProperty({ example: 5 })
  live_orders?: number;

  @ApiProperty({ example: 2 })
  live_leads?: number;

  @ApiProperty({ example: 4.5 })
  ratings?: number;

  @ApiProperty({ example: 15 })
  total_fleets?: number;

  @ApiProperty({ type: () => VendorOrderActivityDto, isArray: true })
  order_activity?: VendorOrderActivityDto[];
}

export class VendorOrderActivityDto {
  @ApiProperty({ example: 'OID01516165151' })
  formated_id: string;

  @ApiProperty({ example: '27/01/2025 04:59 PM' })
  date: string;

  @ApiProperty({ example: 'Order Competed' })
  status: string;

  @ApiProperty({ example: 'if this activity has remark it may be shown here', nullable: true })
  remarks: string | null;
}
