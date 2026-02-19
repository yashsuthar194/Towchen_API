import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { VendorServices } from 'generated/prisma/enums';

export class CreateVendorDto {
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  number: string;

  @IsNotEmpty()
  password: string;

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
}
