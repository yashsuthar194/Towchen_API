import { PartialType, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { CreateDriverDto } from './create-driver.dto';
import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDriverDto extends PartialType(CreateDriverDto) {
  /**
   * Extracts driver-only data
   */
  static toDriverData(dto: UpdateDriverDto) {
    const { sub_service_id, service_location_id, ...rest } = dto;
    return {
      ...rest,
      ...(sub_service_id !== undefined ? { sub_service_id: Number(sub_service_id) } : {}),
      ...(service_location_id !== undefined ? { service_location_id: Number(service_location_id) } : {}),
    };
  }
}

export class VendorUpdateDriverDto extends OmitType(UpdateDriverDto, ['vendor_id', 'password'] as const) {}
