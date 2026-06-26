import { PartialType } from '@nestjs/swagger';
import { CreateVehicleClassConfigDto } from './create-config.dto';

export class UpdateVehicleClassConfigDto extends PartialType(CreateVehicleClassConfigDto) {}
