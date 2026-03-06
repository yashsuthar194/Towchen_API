import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { FuelType } from '@prisma/client';

export class RegisterCustomerVehicleDto {
  @ApiProperty({
    example: 'Toyota',
    description: 'Vehicle make or company name',
  })
  @IsNotEmpty()
  @IsString()
  make: string;

  @ApiProperty({ example: 'Corolla', description: 'Vehicle model' })
  @IsNotEmpty()
  @IsString()
  model: string;

  @ApiProperty({
    example: 'MH01AB1234',
    description: 'Vehicle registration number',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/, {
    message:
      'registration_number must be a valid Indian registration number (e.g. MH01AB1234)',
  })
  registration_number: string;

  @ApiProperty({ example: 'SUV', description: 'Vehicle class' })
  @IsNotEmpty()
  @IsString()
  class: string;

  @ApiProperty({
    example: FuelType.Petrol,
    description: 'Vehicle fuel type',
    enum: FuelType,
    enumName: 'FuelType',
  })
  @IsNotEmpty()
  @IsEnum(FuelType, {
    message: `fuel_type must be one of: ${Object.values(FuelType).join(', ')}`,
  })
  fuel_type: FuelType;
}

export class RegisterCustomerDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the customer',
  })
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @ApiProperty({
    example: '9876543210',
    description: 'Mobile number of the customer',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'number must be a valid 10-digit Indian mobile number',
  })
  number: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address of the customer',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    type: RegisterCustomerVehicleDto,
    description: 'Vehicle details of the customer',
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RegisterCustomerVehicleDto)
  vehicle: RegisterCustomerVehicleDto;
}
