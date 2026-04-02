import {
  OrganizationType,
  SignatureType,
  vendor,
  VendorServices,
  VendorStatus,
} from '@prisma/client';

export class VendorDto implements vendor {
  id: number;
  formated_id: string;
  vendor_name: string;
  email: string;
  mobile_number: string;
  alternate_number: string;
  password: string;
  is_email_verified: boolean;
  is_number_verified: boolean;
  vendor_profile_image_url: string;
  services: VendorServices;
  pan_card_url: string;
  pan_number: string;
  aadhar_card_url: string;

  organization_name: string;
  organization_certificate_url: string;
  organization_type: OrganizationType;

  gst_number: string;
  gst_certificate_url: string;
  is_gst_vendor: boolean;

  status: VendorStatus;

  agreement_status: boolean;
  representative_name: string;
  representative_designation: string;

  signature_type: SignatureType;
  signature_url: string;

  approved_by: number | null;
  is_deleted: boolean;
  is_deleted_by: number | null;

  created_at: Date;
  updated_at: Date;
}
