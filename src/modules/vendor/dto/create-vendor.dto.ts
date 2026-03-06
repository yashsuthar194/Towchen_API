import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { VendorServices } from '@prisma/client';

export class CreateVendorDto {
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'number must be a valid 10-digit Indian mobile number',
  })
  number: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'alternate_number must be a valid 10-digit Indian mobile number',
  })
  alternate_number: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password: string;

  @IsBoolean()
  @IsNotEmpty()
  is_gst_vendor: boolean;

  @ApiProperty({
    type: [String],
    enum: Object.values(VendorServices),
    example: [VendorServices.ROS],
    description: 'Send as JSON string, e.g. \'["ROS","CATERING"]\'',
  })
  @Transform(({ value }) => {
    // Already an array (e.g., from repeated form fields: services=ROS&services=CATERING)
    if (Array.isArray(value)) return value;

    if (typeof value === 'string') {
      try {
        // Try JSON string: '["ROS","CATERING"]'
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Plain string: 'ROS' → ['ROS']
        return [value];
      }
    }

    return [value];
  })
  @IsArray()
  @IsEnum(VendorServices, { each: true })
  services: VendorServices[];

  @IsNotEmpty()
  @IsString()
  org_name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'org_number must be a valid 10-digit Indian mobile number',
  })
  org_number: string;

  @IsNotEmpty()
  @IsEmail()
  org_email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, {
    message: 'gst_number must be a valid GST number',
  })
  gst_number: string;

  // Bank detail fields (flattened for FormData compatibility)
  @IsNotEmpty()
  @IsString()
  bank_name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{9,18}$/, {
    message: 'account_number must be a valid bank account number (9-18 digits)',
  })
  account_number: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/i, {
    message: 'ifsc_code must be a valid IFSC code (e.g. SBIN0001234)',
  })
  ifsc_code: string;

  @IsNotEmpty()
  @IsString()
  branch_name: string;

  @IsNotEmpty()
  @IsString()
  account_holder_name: string;

  @IsNotEmpty()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  agreement_status: boolean = false;

  /**
   * Extracts vendor-only data (without bank detail fields)
   */
  static toVendorData(dto: CreateVendorDto) {
    const {
      bank_name,
      account_number,
      ifsc_code,
      branch_name,
      account_holder_name,
      ...vendorData
    } = dto;
    return vendorData;
  }

  /**
   * Extracts bank detail fields from the flat DTO
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
