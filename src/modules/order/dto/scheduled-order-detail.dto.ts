import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduledOrderStatus } from '@prisma/client';

export class ScheduledOrderDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ description: 'Unique idempotency key (UUID) — guarantees at-most-once promotion' })
  idempotency_key: string;

  @ApiProperty()
  customer_id: number;

  @ApiProperty({ enum: ScheduledOrderStatus })
  status: ScheduledOrderStatus;

  @ApiProperty({ description: 'Scheduled execution datetime (UTC stored, original timezone preserved)' })
  scheduled_at: Date;

  @ApiProperty({ example: 'Asia/Kolkata' })
  timezone: string;

  @ApiPropertyOptional({ description: 'ID of the live order created when this booking was promoted' })
  promoted_order_id?: number;

  @ApiProperty()
  attempt_count: number;

  @ApiPropertyOptional({ description: 'Human-readable description of the last execution failure' })
  last_error?: string;

  @ApiPropertyOptional()
  cancelled_at?: Date;

  @ApiPropertyOptional()
  cancel_reason?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
