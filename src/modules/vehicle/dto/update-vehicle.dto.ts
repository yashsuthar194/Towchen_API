import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';
import { VehicleStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
    @ApiProperty({ enum: VehicleStatus, required: false })
    @IsOptional()
    @IsEnum(VehicleStatus)
    status?: VehicleStatus;

    /**
     * Extracts vehicle-only data
     */
    static toVehicleData(dto: UpdateVehicleDto) {
        const { vendor_id, ...vehicleData } = dto;
        return vehicleData;
    }
}

export class VendorUpdateVehicleDto extends OmitType(UpdateVehicleDto, [
  'vendor_id',
] as const) {}
