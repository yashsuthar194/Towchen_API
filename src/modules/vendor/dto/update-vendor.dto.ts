import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsArray,
  IsEnum,
  Matches,
  IsOptional,
} from 'class-validator';
import {
  OrganizationType,
  VendorServices,
} from '@prisma/client';

/**
 * DTO for updating an existing vendor's profile and bank details.
 *
 * Accepts a plain JSON payload (no file uploads).
 * Document uploads are handled via separate `PUT /vendor/document/*` endpoints.
 * Agreement fields are managed via `PUT /vendor/agreement`.
 *
 * @remarks
 * All fields are required for a full update. Partial updates are not supported.
 */
export class UpdateVendorDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Rajesh Kumar' })
  vendor_name: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'rajesh@example.com' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'mobile_number must be a valid 10-digit Indian mobile number',
  })
  @ApiProperty({ example: '9876543210' })
  mobile_number: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'alternate_number must be a valid 10-digit Indian mobile number',
  })
  @ApiProperty({ example: '8765432109' })
  alternate_number: string;

  /** Services the vendor provides */
  @IsEnum(VendorServices)
  @ApiProperty({
    type: String,
    enum: VendorServices,
    example: VendorServices.Towing,
  })
  select_services: VendorServices;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Kumar Towing Services Pvt Ltd' })
  organization_name: string;

  /** Type of organization */
  @IsEnum(OrganizationType)
  @ApiProperty({ enum: OrganizationType, example: OrganizationType.Cooperative })
  organization_type: OrganizationType;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, {
    message: 'gst_number must be a valid GST number',
  })
  @ApiProperty({ example: '27AAPFU0939F1ZV' })
  gst_number?: string;

  // ── Bank detail fields (flattened for JSON compatibility) ──

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'State Bank of India' })
  bank_name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{9,18}$/, {
    message: 'account_number must be a valid bank account number (9-18 digits)',
  })
  @ApiProperty({ example: '20235678901234' })
  account_number: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/i, {
    message: 'ifsc_code must be a valid IFSC code (e.g. SBIN0001234)',
  })
  @ApiProperty({ example: 'SBIN0001234' })
  ifsc_code: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Andheri West Branch' })
  branch_name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Rajesh Kumar' })
  account_holder_name: string;

  /**
   * Extracts vendor-only data (without bank detail fields)
   */
  static toVendorData(dto: UpdateVendorDto) {
    const {
      bank_name,
      account_number,
      ifsc_code,
      branch_name,
      account_holder_name,
      select_services,
      ...vendorData
    } = dto;
    return {
      ...vendorData,
      services: select_services,
      gst_number: dto.gst_number ?? null,
      is_gst_vendor: !!dto.gst_number,
    };
  }

  /**
   * Extracts bank detail fields from the flat DTO
   */
  static toBankDetail(dto: UpdateVendorDto) {
    return {
      bank_name: dto.bank_name,
      account_number: dto.account_number,
      ifsc_code: dto.ifsc_code,
      branch_name: dto.branch_name,
      account_holder_name: dto.account_holder_name,
    };
  }
}
