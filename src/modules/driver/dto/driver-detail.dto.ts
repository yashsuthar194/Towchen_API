import { DriverStatus } from '@prisma/client';

export class DriverDetailDto {
    id: number;
    formated_id: string;
    vendor_id: number;
    vehicle_id: number | null;
    full_name: string;
    number: string;
    alternate_number: string;
    email: string;
    is_email_verified: boolean;
    is_number_verified: boolean;
    adhar_card_url: string;
    pan_card_url: string;
    driver_license_url: string;
    status: DriverStatus;
    created_at: Date;
    updated_at: Date;
    vehicle?: any; // You might want to create a VehicleDetailDto later
}
