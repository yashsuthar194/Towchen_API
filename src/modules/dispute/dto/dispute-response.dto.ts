import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DisputeType,
  DisputeStatus,
  DisputeStep,
  DisputeAction,
  DisputeRole,
} from '@prisma/client';

export class DisputeAuditLogResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  dispute_request_id: number;

  @ApiProperty({ enum: DisputeStep, example: DisputeStep.Verification })
  step: DisputeStep;

  @ApiProperty({ enum: DisputeAction, example: DisputeAction.Verify })
  action: DisputeAction;

  @ApiProperty({ enum: DisputeStatus, example: DisputeStatus.PendingVerification })
  previous_status: DisputeStatus;

  @ApiProperty({ enum: DisputeStatus, example: DisputeStatus.PendingFinalization })
  new_status: DisputeStatus;

  @ApiProperty({ example: 5 })
  performed_by_id: number;

  @ApiProperty({ example: 'Admin' })
  performed_by_role: string;

  @ApiPropertyOptional({ enum: DisputeRole, example: DisputeRole.Verifier })
  actor_dispute_role?: DisputeRole;

  @ApiPropertyOptional({ example: 500.0 })
  demanded_amount?: number;

  @ApiPropertyOptional({ example: 350.0 })
  approved_amount?: number;

  @ApiPropertyOptional({ example: 'Toll receipt verified.' })
  remarks?: string;

  @ApiProperty({ example: '2026-11-13T19:00:00.000Z' })
  created_at: Date;
}

export class DisputeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'DSP0000001' })
  formated_id: string;

  @ApiProperty({ example: 42 })
  order_id: number;

  @ApiProperty({ example: 7 })
  vendor_id: number;

  @ApiProperty({ enum: DisputeType, example: DisputeType.TollDispute })
  dispute_type: DisputeType;

  @ApiProperty({ example: 500.0 })
  demanded_amount: number;

  @ApiPropertyOptional({ example: 350.0 })
  approved_amount?: number;

  @ApiPropertyOptional({ example: 'Toll paid at expressway.' })
  description?: string;

  @ApiProperty({
    type: [String],
    example: ['https://s3.amazonaws.com/towchen-bucket/disputes/toll_receipt.jpg'],
  })
  proof_urls: string[];

  @ApiProperty({ enum: DisputeStatus, example: DisputeStatus.PendingResolution })
  status: DisputeStatus;

  @ApiProperty({ enum: DisputeStep, example: DisputeStep.Resolution })
  current_step: DisputeStep;

  @ApiProperty({ example: 7 })
  created_by_id: number;

  @ApiPropertyOptional({ example: '2026-11-13T19:30:00.000Z' })
  finalized_at?: Date;

  @ApiPropertyOptional({ example: null })
  terminated_at?: Date;

  @ApiProperty({ example: '2026-11-13T18:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-11-13T19:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ type: () => [DisputeAuditLogResponseDto] })
  audit_logs?: DisputeAuditLogResponseDto[];

  @ApiPropertyOptional({
    example: { id: 42, formated_id: 'ORD0000042', status: 'Completed' },
  })
  order?: {
    id: number;
    formated_id: string;
    status: string;
    completion_time?: Date | null;
  };

  @ApiPropertyOptional({
    example: { id: 7, formated_id: 'VND0000007', vendor_name: 'Shree Towing Services' },
  })
  vendor?: {
    id: number;
    formated_id: string;
    vendor_name: string;
    mobile_number: string;
  };
}
