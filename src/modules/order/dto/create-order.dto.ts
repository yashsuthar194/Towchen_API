import { IsInt, IsNotEmpty, IsEnum, IsOptional, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiProperty({ description: 'Service ID' })
  @IsNotEmpty()
  @IsInt()
  service_id: number;

  @ApiPropertyOptional({ description: 'Sub-Service ID' })
  @IsOptional()
  @IsInt()
  sub_service_id?: number;

  @ApiProperty({ description: 'ID of the sub-service (Fleet Type)', example: 1 })
  @IsNotEmpty()
  @IsInt()
  fleet_type: number;

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
