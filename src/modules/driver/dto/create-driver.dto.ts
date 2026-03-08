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

export class CreateDriverDto implements Partial<driver> {
  @IsNotEmpty()
  @IsString()
  driver_name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'mobile_number must be a valid 10-digit Indian mobile number',
  })
  mobile_number: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message:
      'alternate_mobile_number must be a valid 10-digit Indian mobile number',
  })
  alternate_mobile_number: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicle_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vendor_id?: number;

  /**
   * Extracts driver-only data
   */
  static toDriverData(dto: CreateDriverDto) {
    const { vehicle_id, ...driverData } = dto;
    return driverData;
  }
}
