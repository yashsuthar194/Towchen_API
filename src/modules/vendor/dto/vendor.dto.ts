import { vendor, VendorServices, VendorStatus } from 'generated/prisma/client';

export class VendorDto implements vendor {
  id: number;
  formated_id: string;
  full_name: string;
  email: string;
  number: string;
  password: string;
  is_email_verified: boolean;
  is_number_verified: boolean;
  is_gst_vendor: boolean;
  vendor_image_url: string;
  services: VendorServices[];
  pan_card_url: string;
  adhar_card_url: string;
  org_name: string;
  org_number: string;
  org_alternate_number: string;
  org_certificate_url: string;
  org_email: string;
  gst_number: string;
  gst_certificate_url: string;
  approved_by: number | null;
  is_deleted: boolean;
  is_deleted_by: number | null;
  status: VendorStatus;
  signature_url: string;
  agreement_status: boolean;
  created_at: Date;
  updated_at: Date;
}
