import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignVehicleDto {
  @ApiProperty({ description: 'Vehicle ID to assign (pass 0 to unassign)' })
  @IsNotEmpty()
  @IsInt()
  vehicle_id: number;
}
