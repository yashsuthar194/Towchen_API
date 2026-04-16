import { VehicleStatus } from '@prisma/client';

export class VehicleListDto {
    id: number;
    registration_number: string;
    chassis_number: string;
    engine_number: string;
    vehicle_class: string | null;
    status: VehicleStatus;
    vehicle_status: VehicleStatus;
    created_at: Date;
}
