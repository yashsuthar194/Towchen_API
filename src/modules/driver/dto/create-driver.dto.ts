import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Matches,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { driver } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDriverDto implements Partial<driver> {
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

  @ApiPropertyOptional({ description: 'Associated vehicle ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicle_id?: number;

  @ApiPropertyOptional({ description: 'Associated vendor ID (required if Admin creates driver)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vendor_id?: number;

  @ApiPropertyOptional({ description: 'ID of the driver location for starting point' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  start_location?: number;

  @ApiPropertyOptional({ description: 'ID of the driver location for ending point' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  end_location?: number;

  /**
   * Extracts driver-only data
   */
  static toDriverData(dto: CreateDriverDto) {
    const { vehicle_id, ...driverData } = dto;
    return driverData;
  }
}
