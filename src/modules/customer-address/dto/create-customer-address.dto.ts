import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateCustomerAddressDto {
  @ApiProperty({ description: 'The Google Maps place_id selected by the user', example: 'ChIJN1t_tDeuEmsRUsoyG83frY4' })
  @IsString()
  @IsNotEmpty()
  place_id: string;

  @ApiProperty({ description: 'Label for the address', example: 'Home' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ description: 'Set as default address', example: true })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;

  @ApiPropertyOptional({ description: 'Additional description or instructions', example: 'Ring the bell twice' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Contact name for this address', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Contact number for this address', example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  number: string;
}
