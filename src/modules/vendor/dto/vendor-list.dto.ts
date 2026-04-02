import { ApiProperty } from '@nestjs/swagger';
import { VendorServices, VendorStatus } from '@prisma/client';
import { VendorDto } from './vendor.dto';

export class VendorListDto implements Partial<VendorDto> {
  id: number;
  formated_id: string;
  vendor_name: string;
  email: string;
  mobile_number: string;

  @ApiProperty({
    enum: Object.values(VendorServices),
    example: VendorServices.Towing,
  })
  services: VendorServices;

  approved_by: number | null;

  @ApiProperty({
    enum: Object.values(VendorStatus),
    example: VendorStatus.Pending,
  })
  status: VendorStatus;
  created_at: Date;
}
