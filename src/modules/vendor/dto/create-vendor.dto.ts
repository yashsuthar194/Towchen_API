import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import {
  OrganizationType,
} from '@prisma/client';
import { VendorDto } from './vendor.dto';

/**
 * DTO for creating a new vendor account.
 *
 * Accepts a plain JSON payload. Agreement and document uploads
 * are handled via separate endpoints after registration.
 *
 * @remarks
 * - Agreement fields (`signature_type`, `agreement_status`,
 *   `representative_name`, `representative_designation`) are submitted
 *   via `PUT /vendor/agreement`.
 * - Documents (PAN, Aadhaar, etc.) are uploaded via
 *   `PUT /vendor/document/*` endpoints.
 */
export class CreateVendorDto {
  /** Full name of the vendor or business owner */
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Rajesh Kumar' })
  vendor_name: string;

  /** Vendor's email address (must be unique across vendors) */
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'rajesh@example.com' })
  email: string;

  /** Primary 10-digit Indian mobile number */
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'mobile_number must be a valid 10-digit Indian mobile number',
  })
  @ApiProperty({ example: '9876543210' })
  mobile_number: string;

  /** Alternate 10-digit Indian mobile number */
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'alternate_number must be a valid 10-digit Indian mobile number',
  })
  @ApiProperty({ example: '8765432109' })
  alternate_number: string;

  /** Account password (minimum 8 characters) */
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @ApiProperty({ example: 'StrongP@ss1' })
  password: string;

  /** IDs of the services the vendor provides */
  @IsArray()
  @ApiProperty({
    type: [Number],
    isArray: true,
    example: [1, 2],
  })
  service_ids: number[];

  /** Name of the vendor's organization or business */
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Kumar Towing Services Pvt Ltd' })
  organization_name: string;

  /** Type of organization */
  @IsEnum(OrganizationType)
  @ApiProperty({ enum: OrganizationType, example: OrganizationType.Cooperative })
  organization_type: OrganizationType;

  /** GST identification number (15-character alphanumeric format) */
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, {
    message: 'gst_number must be a valid GST number',
  })
  @ApiProperty({ example: '27AAPFU0939F1ZV' })
  gst_number?: string;

  // ── Bank detail fields (flattened for JSON compatibility) ──

  /** Name of the vendor's bank */
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'State Bank of India' })
  bank_name: string;

  /** Bank account number (9–18 digits) */
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{9,18}$/, {
    message: 'account_number must be a valid bank account number (9-18 digits)',
  })
  @ApiProperty({ example: '20235678901234' })
  account_number: string;

  /** IFSC code of the bank branch (e.g. SBIN0001234) */
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/i, {
    message: 'ifsc_code must be a valid IFSC code (e.g. SBIN0001234)',
  })
  @ApiProperty({ example: 'SBIN0001234' })
  ifsc_code: string;

  /** Name of the bank branch */
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Andheri West Branch' })
  branch_name: string;

  /** Name of the bank account holder */
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Rajesh Kumar' })
  account_holder_name: string;

  /**
   * Extracts vendor-only data from the DTO (excludes bank detail fields
   * and the `select_services` rename).
   *
   * @returns An object suitable for Prisma's `vendor.create({ data })`,
   *          with `services` mapped from `select_services`.
   */
  static toVendorData(dto: CreateVendorDto) {
    const {
      bank_name,
      account_number,
      ifsc_code,
      branch_name,
      account_holder_name,
      service_ids,
      ...vendorData
    } = dto;
    return {
      ...vendorData,
      service_ids: service_ids.map((id) => Number(id)),
      gst_number: dto.gst_number ?? null,
      is_gst_vendor: !!dto.gst_number,
    };
  }

  /**
   * Extracts bank detail fields from the flat DTO.
   *
   * @returns An object suitable for Prisma's `vendor_bank_detail.create({ data })`.
   */
  static toBankDetail(dto: CreateVendorDto) {
    return {
      bank_name: dto.bank_name,
      account_number: dto.account_number,
      ifsc_code: dto.ifsc_code,
      branch_name: dto.branch_name,
      account_holder_name: dto.account_holder_name,
    };
  }
}
