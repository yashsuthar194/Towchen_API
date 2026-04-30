import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Matches,
  MinLength,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { driver } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty({ description: 'Full name of the driver', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  driver_name: string;

  @ApiProperty({ description: 'Primary mobile number', example: '9876543210' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'mobile_number must be a valid 10-digit Indian mobile number',
  })
  mobile_number: string;

  @ApiProperty({ description: 'Alternative contact number', example: '9876543211' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message:
      'alternate_mobile_number must be a valid 10-digit Indian mobile number',
  })
  alternate_mobile_number: string;

  @ApiProperty({ description: 'Email address of the driver', example: 'driver@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password for driver login', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password: string;

  @ApiProperty({
    description: 'ID of the sub-service provided by the driver',
    type: Number,
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  sub_service_id: number;



  @ApiPropertyOptional({ description: 'Associated vendor ID (required if Admin creates driver)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vendor_id?: number;

  @ApiPropertyOptional({ description: 'ID of the driver location (used for both start and end locations)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  location_spot?: number | null;


  /**
   * Extracts driver-only data
   */
  static toDriverData(dto: CreateDriverDto) {
    const { location_spot, sub_service_id, ...rest } = dto;
    return {
      ...rest,
      sub_service_id: Number(sub_service_id),
      ...(location_spot !== undefined ? { start_location_id: location_spot, end_location_id: location_spot } : {})
    };
  }
}

export class VendorCreateDriverDto extends OmitType(CreateDriverDto, ['vendor_id'] as const) {}
