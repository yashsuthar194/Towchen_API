import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for vendor driver status counts (for tab badges).
 */
export class VendorDriverStatusCountsDto {
  @ApiProperty({ description: 'Total non-deleted drivers', example: 12 })
  total: number;

  @ApiProperty({ description: 'Drivers with Available status', example: 6 })
  Available: number;

  @ApiProperty({ description: 'Drivers with Busy status', example: 3 })
  Busy: number;

  @ApiProperty({ description: 'Drivers with UnderApproval status', example: 2 })
  UnderApproval: number;

  @ApiProperty({ description: 'Drivers with Banned status', example: 1 })
  Banned: number;
}

/**
 * Response DTO for vendor vehicle status counts (for tab badges).
 */
export class VendorVehicleStatusCountsDto {
  @ApiProperty({ description: 'Total non-deleted vehicles', example: 10 })
  total: number;

  @ApiProperty({ description: 'Vehicles with Available status', example: 7 })
  Available: number;

  @ApiProperty({ description: 'Vehicles with UnderApproval status', example: 2 })
  UnderApproval: number;

  @ApiProperty({ description: 'Vehicles with Banned status', example: 1 })
  Banned: number;
}
