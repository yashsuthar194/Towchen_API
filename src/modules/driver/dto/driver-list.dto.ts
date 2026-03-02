import { DriverStatus } from '@prisma/client';

export class DriverListDto {
    id: number;
    formated_id: string;
    full_name: string;
    email: string;
    number: string;
    status: DriverStatus;
    created_at: Date;
}
