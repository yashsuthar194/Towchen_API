import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsArray,
  IsEnum,
} from 'class-validator';
import { VendorServices } from '@prisma/client';

export class UpdateVendorDto {
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  number: string;

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
  org_name: string;

  @IsNotEmpty()
  org_number: string;

  @IsNotEmpty()
  org_alternate_number: string;

  @IsNotEmpty()
  @IsEmail()
  org_email: string;

  @IsNotEmpty()
  gst_number: string;

  // Bank detail fields (flattened for FormData compatibility)
  @IsNotEmpty()
  @IsString()
  bank_name: string;

  @IsNotEmpty()
  @IsString()
  account_number: string;

  @IsNotEmpty()
  @IsString()
  ifsc_code: string;

  @IsNotEmpty()
  @IsString()
  branch_name: string;

  @IsNotEmpty()
  @IsString()
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
      ...vendorData
    } = dto;
    return vendorData;
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
