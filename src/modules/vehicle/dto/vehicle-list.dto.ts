import { VehicleStatus, AvailabilityStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { PaginatedListDto } from '../../../core/response/dto/paginated-list.dto';
import { SubServiceDto } from '../../vendor/dto/service.dto';

export class VehicleListDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Underlift' })
  fleet_type: string;

  @ApiProperty({ example: 'MH12AB1234' })
  registration_number: string;

  @ApiProperty({ example: 'ABC123456789' })
  chassis_number: string;

  @ApiProperty({ example: 'ENG123456789' })
  engine_number: string;

  @ApiProperty({ example: 'Sedan', nullable: true })
  vehicle_class: string | null;

  @ApiProperty({ enum: VehicleStatus })
  status: VehicleStatus;

  @ApiProperty({ enum: AvailabilityStatus })
  availability_status: AvailabilityStatus;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  created_at: Date;

  @ApiProperty({ description: 'Assigned driver details', required: false })
  driver?: {
    id: number;
    driver_name: string;
    mobile_number: string;
  };
}

export class VehiclePaginatedListDto extends PaginatedListDto<VehicleListDto> {
  @ApiProperty({ type: [VehicleListDto] })
  declare list: VehicleListDto[];
}
