import { VehicleStatus, AvailabilityStatus } from '@prisma/client';

import { SubServiceDto } from '../../vendor/dto/service.dto';

export class VehicleDetailDto {
    id: number;
    fleet_type: string;
    vendor_id: number;
    registration_number: string;
    chassis_number: string;
    engine_number: string;
    vehicle_class: string | null;
    status: VehicleStatus;
    availability_status: AvailabilityStatus;
    vehicle_validity: Date;
    insurance_validity: Date;
    fitness_validity: Date;
    puc_validity: Date;
    vehical_image_url: string[];
    chassis_image_url: string | null;
    tax_image_url: string | null;
    insurance_image_url: string | null;
    fitness_image_url: string | null;
    puc_image_url: string | null;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
    driver?: {
        id: number;
        driver_name: string;
        mobile_number: string;
    };
}
