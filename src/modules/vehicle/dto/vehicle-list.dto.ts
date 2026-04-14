export class VehicleListDto {
    id: number;
    registration_number: string;
    chassis_number: string;
    engine_number: string;
    vehicle_class: string | null;
    created_at: Date;
}
