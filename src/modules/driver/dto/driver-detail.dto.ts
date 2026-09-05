import { driver, DriverStatus, AvailabilityStatus } from '@prisma/client';
import { SubServiceDto } from '../../vendor/dto/service.dto';
import { ServiceLocationDto } from '../../service-location/dto/service-location.dto';
import { VehicleDetailDto } from '../../vehicle/dto/vehicle-detail.dto';
import { ApiProperty } from '@nestjs/swagger';

export class DriverDetailDto {
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

  @ApiProperty({ description: 'URL to Driver Profile Image', nullable: true })
  driver_image_url: string | null;

  @ApiProperty({ description: 'ID of the service area location the driver operates in', nullable: true })
  service_location_id: number | null;

  @ApiProperty({ description: 'Service location details', required: false, type: () => ServiceLocationDto })
  service_location?: ServiceLocationDto;

  @ApiProperty({ enum: DriverStatus, description: 'Current status of the driver' })
  status: DriverStatus;

  @ApiProperty({ enum: AvailabilityStatus, description: 'Driver online/offline status' })
  availability_status: AvailabilityStatus;

  @ApiProperty({ example: 'Underlift', required: false, nullable: true })
  sub_service?: string;

  @ApiProperty({ description: 'Average rating of the driver', example: 4.5, required: false })
  average_rating?: number;

  @ApiProperty({ description: 'Total reviews count for the driver', example: 10, required: false })
  total_reviews?: number;

  @ApiProperty({ description: 'Total stars sum received by driver (e.g. 4 + 3 + 5 = 12 stars)', example: 45, required: false })
  total_stars?: number;

  @ApiProperty({ description: 'Record creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  updated_at: Date;

  @ApiProperty({ description: 'Assigned vehicle details', required: false, type: () => VehicleDetailDto })
  vehicle?: VehicleDetailDto;

  @ApiProperty({ description: 'Vendor details', required: false })
  vendor?: { id: number; formated_id: string; vendor_name: string };

  @ApiProperty({ description: 'ID of the user who deleted this record', nullable: true, required: false })
  is_deleted_by?: number | null | undefined;
}
