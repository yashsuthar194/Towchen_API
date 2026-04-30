import { OrganizationType, VendorStatus } from '@prisma/client';
import { VendorDto } from './vendor.dto';
import { ServiceDto } from './service.dto';
import { ApiProperty } from '@nestjs/swagger';

export class VendorListDto {
  id: number;
  formated_id: string;
  vendor_name: string;
  email: string;
  mobile_number: string;

  @ApiProperty({
    type: ServiceDto,
    isArray: true,
  })
  services: ServiceDto[];

  approved_by: number | null;

  @ApiProperty({
    enum: Object.values(VendorStatus),
    example: VendorStatus.Pending,
  })
  status: VendorStatus;
  created_at: Date;
}
