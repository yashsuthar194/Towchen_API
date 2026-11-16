import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyVehicleRcDto {
  @ApiProperty({
    description: 'Vehicle Registration Number (e.g. PY01MW8769 or MH01AB1234)',
    example: 'PY01MW8769',
  })
  @IsNotEmpty({ message: 'vehicle_number is required' })
  @IsString({ message: 'vehicle_number must be a string' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '').toUpperCase() : value))
  vehicle_number: string;

  @ApiPropertyOptional({
    description: 'Unique verification tracking ID (alphanumeric, dot, dash, underscore, max 50 chars). If omitted, an ID is auto-generated.',
    example: 'test001',
  })
  @IsOptional()
  @IsString({ message: 'verification_id must be a string' })
  @MaxLength(50, { message: 'verification_id cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'verification_id can only contain alphanumeric characters, dots (.), hyphens (-), and underscores (_)',
  })
  verification_id?: string;
}

