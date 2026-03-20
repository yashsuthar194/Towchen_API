import { IsString, IsEmail, IsOptional, IsInt, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateDriverProfileDto {
  @ApiPropertyOptional({ description: 'Full name of the driver', example: 'John Doe' })
  @IsOptional()
  @IsString()
  driver_name?: string;

  @ApiPropertyOptional({ description: 'Primary mobile number', example: '9876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'mobile_number must be a valid 10-digit Indian mobile number',
  })
  mobile_number?: string;

  @ApiPropertyOptional({ description: 'Alternative contact number', example: '9876543211' })
  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'alternate_mobile_number must be a valid 10-digit Indian mobile number',
  })
  alternate_mobile_number?: string;

  @ApiPropertyOptional({ description: 'Email address of the driver', example: 'driver@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Associated vehicle ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicle_id?: number;
}
