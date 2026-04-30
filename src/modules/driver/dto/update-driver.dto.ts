import { PartialType, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { CreateDriverDto } from './create-driver.dto';
import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDriverDto extends PartialType(CreateDriverDto) {
  /**
   * Extracts driver-only data
   */
  static toDriverData(dto: UpdateDriverDto) {
    const { location_spot, sub_service_id, ...rest } = dto;
    return {
      ...rest,
      ...(sub_service_id !== undefined ? { sub_service_id: Number(sub_service_id) } : {}),
      ...(location_spot !== undefined ? { start_location_id: location_spot, end_location_id: location_spot } : {})
    };
  }
}

export class VendorUpdateDriverDto extends OmitType(UpdateDriverDto, ['vendor_id', 'password'] as const) {}
