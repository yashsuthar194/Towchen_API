import { PartialType } from '@nestjs/swagger';
import { CreateDriverLocationDto } from './create-driver-location.dto';

export class UpdateDriverLocationDto extends PartialType(CreateDriverLocationDto) {}
