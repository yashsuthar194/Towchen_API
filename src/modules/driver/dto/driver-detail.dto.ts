import { driver, DriverStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class DriverDetailDto implements Partial<driver> {
  @ApiProperty({ description: 'Unique identifier for the driver' })
  id: number;

  @ApiProperty({ description: 'Formated display ID' })
  formated_id: string;

  @ApiProperty({ description: 'ID of the vendor this driver belongs to' })
  vendor_id: number;

  @ApiProperty({ description: 'ID of the assigned vehicle', nullable: true })
  vehicle_id: number | null;

  @ApiProperty({ description: 'Full name of the driver' })
  driver_name: string;

  @ApiProperty({ description: 'Primary mobile number' })
  mobile_number: string;

  @ApiProperty({ description: 'Alternative mobile number' })
  alternate_mobile_number: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Email verification status' })
  is_email_verified: boolean;

  @ApiProperty({ description: 'Mobile number verification status' })
  is_number_verified: boolean;

  @ApiProperty({ description: 'URL to Aadhar card document' })
  aadhar_card_url: string;

  @ApiProperty({ description: 'URL to PAN card document' })
  pan_card_url: string;

  @ApiProperty({ description: 'URL to Driver License document' })
  driver_license_url: string;

  @ApiProperty({ description: 'ID of the start location', nullable: true })
  start_location: number | null;

  @ApiProperty({ description: 'ID of the end location', nullable: true })
  end_location: number | null;

  @ApiProperty({ enum: DriverStatus, description: 'Current status of the driver' })
  status: DriverStatus;

  @ApiProperty({ description: 'Record creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  updated_at: Date;

  @ApiProperty({ description: 'Assigned vehicle details', required: false })
  vehicle?: any;

  @ApiProperty({ description: 'ID of the user who deleted this record', nullable: true, required: false })
  is_deleted_by?: number | null | undefined;
}
