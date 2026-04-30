import {
  IsString,
  IsEnum,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsInt,
} from 'class-validator';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateVehicleDto {
  @ApiProperty({ description: 'ID of the sub-service (Fleet Type)', example: 1 })
  @IsInt()
  @Type(() => Number)
  fleet_type: number;

  @IsNotEmpty()
  @IsString()
  fleet_location: string;

  @IsNotEmpty()
  @IsString()
  registration_number: string;

  @IsNotEmpty()
  @IsString()
  make: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsNotEmpty()
  @IsString()
  owner_name: string;

  @IsNotEmpty()
  @IsString()
  chassis_number: string;

  @IsNotEmpty()
  @IsString()
  engine_number: string;

  @IsOptional()
  @IsString()
  vehicle_class?: string;

  @IsDate()
  @Transform(({ value }) => {
    if (!value) return value;
    let date: Date;
    if (typeof value === 'string' && value.includes('/')) {
      const [day, month, year] = value.split('/').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(value);
    }
    return isNaN(date.getTime()) ? value : date;
  })
  vehicle_validity: Date;

  @IsDate()
  @Transform(({ value }) => {
    if (!value) return value;
    let date: Date;
    if (typeof value === 'string' && value.includes('/')) {
      const [day, month, year] = value.split('/').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(value);
    }
    return isNaN(date.getTime()) ? value : date;
  })
  insurance_validity: Date;

  @IsDate()
  @Transform(({ value }) => {
    if (!value) return value;
    let date: Date;
    if (typeof value === 'string' && value.includes('/')) {
      const [day, month, year] = value.split('/').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(value);
    }
    return isNaN(date.getTime()) ? value : date;
  })
  fitness_validity: Date;

  @IsDate()
  @Transform(({ value }) => {
    if (!value) return value;
    let date: Date;
    if (typeof value === 'string' && value.includes('/')) {
      const [day, month, year] = value.split('/').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(value);
    }
    return isNaN(date.getTime()) ? value : date;
  })
  puc_validity: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vendor_id?: number;

  /**
   * Extracts vehicle-only data
   */
  static toVehicleData(dto: CreateVehicleDto) {
    const { vendor_id, ...vehicleData } = dto;
    return vehicleData;
  }
}

export class VendorCreateVehicleDto extends OmitType(CreateVehicleDto, [
  'vendor_id',
] as const) {}
