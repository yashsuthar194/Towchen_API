import { PartialType } from '@nestjs/swagger';
import { RegisterCustomerVehicleDto } from './register-customer.dto';

export class UpdateCustomerVehicleDto extends PartialType(RegisterCustomerVehicleDto) {}
