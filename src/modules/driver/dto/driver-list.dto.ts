import { driver, DriverStatus } from '@prisma/client';

export class DriverListDto implements Partial<driver> {
  id: number;
  formated_id: string;
  driver_name: string;
  email: string;
  alternate_mobile_number: string;
  status: DriverStatus;
  created_at: Date;
}
