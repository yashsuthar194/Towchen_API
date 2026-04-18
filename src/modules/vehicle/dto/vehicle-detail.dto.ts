import { VehicleStatus, VehicleAvailabilityStatus } from '@prisma/client';

export class VehicleDetailDto {
    id: number;
    vendor_id: number;
    registration_number: string;
    chassis_number: string;
    engine_number: string;
    vehicle_class: string | null;
    status: VehicleStatus;
    availability_status: VehicleAvailabilityStatus;
    vehicle_validity: Date;
    insurance_validity: Date;
    fitness_validity: Date;
    puc_validity: Date;
    vehical_image_url: string[];
    chassis_image_url: string[];
    tax_image_url: string[];
    insurance_image_url: string[];
    fitness_image_url: string[];
    puc_image_url: string[];
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}
