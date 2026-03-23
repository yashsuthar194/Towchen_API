import { PartialType, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { CreateDriverDto } from './create-driver.dto';
import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDriverDto extends PartialType(CreateDriverDto) {
  @ApiPropertyOptional({ description: 'Associated vehicle ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicle_id?: number;
  /**
   * Extracts driver-only data
   */
  static toDriverData(dto: UpdateDriverDto) {
    const { location_spot, select_services, ...rest } = dto;
    return {
      ...rest,
      ...(select_services !== undefined ? { services: select_services } : {}),
      ...(location_spot !== undefined ? { start_location_id: location_spot, end_location_id: location_spot } : {})
    };
  }
}

export class VendorUpdateDriverDto extends OmitType(UpdateDriverDto, ['vendor_id', 'password'] as const) {}
