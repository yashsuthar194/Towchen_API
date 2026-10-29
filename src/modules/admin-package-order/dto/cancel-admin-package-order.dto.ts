import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelAdminPackageOrderDto {
  @ApiProperty({
    example: 'Customer requested cancellation, vehicle towed privately.',
    description: 'Mandatory reason for cancelling the order',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}

export class RescheduleAdminPackageOrderDto {
  @ApiProperty({
    example: '2026-10-28T14:30:00.000Z',
    description: 'New scheduled activation date/time in ISO format',
  })
  @IsString()
  @IsNotEmpty()
  activation_time: string;

  @ApiPropertyOptional({
    example: '2026-10-28T16:00:00.000Z',
    description: 'Optional updated ETA',
  })
  @IsOptional()
  @IsString()
  eta?: string;

  @ApiPropertyOptional({
    example: 'Customer requested delayed pickup due to delay at garage.',
    description: 'Reason for rescheduling',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}
