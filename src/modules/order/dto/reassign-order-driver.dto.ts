import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ReassignOrderDriverDto {
  @ApiProperty({ example: 5, description: 'ID of the vendor' })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  vendor_id: number;

  @ApiProperty({ example: 12, description: 'ID of the newly assigned driver' })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  driver_id: number;

  @ApiPropertyOptional({ example: 8, description: 'ID of the assigned towing fleet vehicle (optional)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vehicle_id?: number;

  @ApiPropertyOptional({
    example: 'Original driver vehicle had flat tyre, reassigned backup driver.',
    description: 'Reason for manual re-assignment (logged in remarks / audit trail)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
