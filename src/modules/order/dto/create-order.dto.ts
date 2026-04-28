import { IsInt, IsNotEmpty, IsEnum, IsOptional, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorServices, FleetType } from '@prisma/client';
import { CreateDriverLocationDto } from '../../driver-location/dto/create-driver-location.dto';

export class CreateOrderDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsNotEmpty()
  @IsInt()
  customer_id: number;

  @ApiPropertyOptional({ description: 'Customer Vehicle ID' })
  @IsOptional()
  @IsInt()
  customer_vehicle_id?: number;

  @ApiProperty({ description: 'Service Type', enum: VendorServices })
  @IsNotEmpty()
  @IsEnum(VendorServices)
  service_type: VendorServices;

  @ApiProperty({ description: 'Fleet Type', enum: FleetType })
  @IsNotEmpty()
  @IsEnum(FleetType)
  fleet_type: FleetType;

  @ApiProperty({ description: 'Breakdown Location Details' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateDriverLocationDto)
  breakdown_location: CreateDriverLocationDto;

  @ApiProperty({ description: 'Drop Location Details' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateDriverLocationDto)
  drop_location: CreateDriverLocationDto;

  @ApiPropertyOptional({ description: 'Breakdown Contact Name' })
  @IsOptional()
  @IsString()
  breakdown_contact_name?: string;

  @ApiPropertyOptional({ description: 'Breakdown Contact Number' })
  @IsOptional()
  @IsString()
  breakdown_contact_number?: string;

  @ApiPropertyOptional({ description: 'Drop Contact Name' })
  @IsOptional()
  @IsString()
  drop_contact_name?: string;

  @ApiPropertyOptional({ description: 'Drop Contact Number' })
  @IsOptional()
  @IsString()
  drop_contact_number?: string;
}
