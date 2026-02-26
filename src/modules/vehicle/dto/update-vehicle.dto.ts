import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
    /**
     * Extracts vehicle-only data
     */
    static toVehicleData(dto: UpdateVehicleDto) {
        return dto;
    }
}
