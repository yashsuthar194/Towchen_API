import { ApiProperty } from '@nestjs/swagger';
import { VendorServices, VendorStatus } from '@prisma/client';
import { VendorBankDetailDto } from 'src/modules/vendor-bank-detail/dto/vendor-bank-detail.dto';

export class VendorListDto {
  id: number;
  formated_id: string;
  full_name: string;
  email: string;
  number: string;

  @ApiProperty({
    enum: Object.values(VendorServices),
    example: [VendorServices.ROS],
  })
  services: VendorServices[];

  approved_by: number | null;

  @ApiProperty({
    enum: Object.values(VendorStatus),
    example: VendorStatus.Pending,
  })
  status: VendorStatus;
  created_at: Date;
}
