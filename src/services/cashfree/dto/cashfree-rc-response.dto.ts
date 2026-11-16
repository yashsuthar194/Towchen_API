import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CashfreeVehicleRcResponseDto {
  @ApiProperty({ description: 'Verification ID', example: 'test001' })
  verification_id: string;

  @ApiPropertyOptional({ description: 'Cashfree Reference ID', example: 88 })
  reference_id?: number | string;

  @ApiProperty({ description: 'Verification status (VALID / INVALID)', example: 'VALID' })
  status: string;

  @ApiPropertyOptional({ description: 'Vehicle registration number', example: 'PY01MW8769' })
  reg_no?: string;

  @ApiPropertyOptional({ description: 'Vehicle class', example: 'Motor Car' })
  class?: string;

  @ApiPropertyOptional({ description: 'Chassis number', example: 'MALBK511VMM110528' })
  chassis?: string;

  @ApiPropertyOptional({ description: 'Engine number', example: 'G3LCMM440323' })
  engine?: string;

  @ApiPropertyOptional({ description: 'Manufacturer name', example: 'HYUNDAI MOTOR INDIA LTD' })
  vehicle_manufacturer_name?: string;

  @ApiPropertyOptional({ description: 'Vehicle model', example: 'I20 N LINE N8 1.0TURBO GDI DCT' })
  model?: string;

  @ApiPropertyOptional({ description: 'Vehicle color', example: 'TITAN GREY' })
  vehicle_color?: string;

  @ApiPropertyOptional({ description: 'Vehicle type category', example: 'LMV' })
  type?: string;

  @ApiPropertyOptional({ description: 'Fuel type', example: 'PETROL' })
  fuel_type?: string;

  @ApiPropertyOptional({ description: 'Emission norm standard', example: 'Bharat Stage VI' })
  rc_norm_type?: string;

  @ApiPropertyOptional({ description: 'Registration date (YYYY-MM-DD)', example: '2022-03-15' })
  reg_date?: string;

  @ApiPropertyOptional({ description: 'Fitness expiry date (YYYY-MM-DD)', example: '2037-03-14' })
  fitness_upto?: string;

  @ApiPropertyOptional({ description: 'Insurance expiry date (YYYY-MM-DD)', example: '2025-03-14' })
  insurance_upto?: string;

  @ApiPropertyOptional({ description: 'Insurance company name', example: 'HDFC ERGO General Insurance Co. Ltd.' })
  insurance_company?: string;

  @ApiPropertyOptional({ description: 'Insurance policy number' })
  insurance_policy_no?: string;

  @ApiPropertyOptional({ description: 'Owner name', example: 'JOHN DOE' })
  owner_name?: string;

  @ApiPropertyOptional({ description: 'Owner serial count', example: '1' })
  owner_count?: string | number;

  @ApiPropertyOptional({ description: 'Father / Guardian name' })
  father_name?: string;

  @ApiPropertyOptional({ description: 'Present address' })
  present_address?: string;

  @ApiPropertyOptional({ description: 'Permanent address' })
  permanent_address?: string;

  @ApiPropertyOptional({ description: 'Financier name / hypothecation' })
  financer?: string;

  @ApiPropertyOptional({ description: 'Blacklist status', example: 'NA' })
  blacklist_status?: string;

  @ApiPropertyOptional({ description: 'PUCC expiry date' })
  pucc_upto?: string;

  @ApiPropertyOptional({ description: 'PUCC certificate number' })
  pucc_no?: string;

  @ApiPropertyOptional({ description: 'Optional message from Cashfree' })
  message?: string;
}

