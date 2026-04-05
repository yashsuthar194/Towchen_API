import { driver, DriverStatus, VendorServices } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class DriverListDto implements Partial<driver> {
  @ApiProperty({ description: 'Unique identifier for the driver' })
  id: number;

  @ApiProperty({ description: 'Formated display ID' })
  formated_id: string;

  @ApiProperty({ description: 'Full name of the driver' })
  driver_name: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Alternative mobile number' })
  alternate_mobile_number: string;

  @ApiProperty({ enum: DriverStatus, description: 'Current status of the driver' })
  status: DriverStatus;

  @ApiProperty({ enum: VendorServices, description: 'Service provided by the driver', required: false })
  services?: VendorServices;

  @ApiProperty({ description: 'Record creation timestamp' })
  created_at: Date;
}
