import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConsentAction,
  ConsentEntityType,
  ConsentRole,
  ConsentStatus,
  ConsentStep,
  ConsentType,
  Role,
} from '@prisma/client';

export class ConsentAuditLogResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 10 })
  consent_request_id: number;

  @ApiProperty({ enum: ConsentStep, example: ConsentStep.Approval })
  step: ConsentStep;

  @ApiProperty({ enum: ConsentAction, example: ConsentAction.Approve })
  action: ConsentAction;

  @ApiProperty({ enum: ConsentStatus, example: ConsentStatus.PendingApproval })
  previous_status: ConsentStatus;

  @ApiProperty({ enum: ConsentStatus, example: ConsentStatus.PendingVerification })
  new_status: ConsentStatus;

  @ApiProperty({ example: 3 })
  performed_by_id: number;

  @ApiProperty({ example: 'Admin' })
  performed_by_role: string;

  @ApiProperty({ enum: ConsentRole, example: ConsentRole.Approver })
  actor_consent_role: ConsentRole;

  @ApiPropertyOptional({ example: 'Verified discount calculation.' })
  remarks?: string;

  @ApiPropertyOptional({ example: { ip: '127.0.0.1' } })
  metadata?: any;

  @ApiProperty({ example: '2026-10-04T12:00:00.000Z' })
  created_at: Date;
}

export class ConsentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: ConsentEntityType, example: ConsentEntityType.Order })
  entity_type: ConsentEntityType;

  @ApiPropertyOptional({ example: 42 })
  entity_id?: number;

  @ApiProperty({ enum: ConsentType, example: ConsentType.OrderEdit })
  consent_type: ConsentType;

  @ApiProperty({ example: 'Apply 15% VIP discount and update dropoff remarks' })
  title: string;

  @ApiPropertyOptional({ example: 'Customer experienced service delay.' })
  description?: string;

  @ApiProperty({
    example: { final_amount: 1850.0, remarks: 'VIP discount applied' },
  })
  proposed_payload: any;

  @ApiPropertyOptional({
    example: { final_amount: 2000.0, remarks: null },
  })
  original_payload?: any;

  @ApiProperty({ enum: ConsentStatus, example: ConsentStatus.PendingApproval })
  status: ConsentStatus;

  @ApiProperty({ enum: ConsentStep, example: ConsentStep.Approval })
  current_step: ConsentStep;

  @ApiProperty({ example: 2 })
  created_by_id: number;

  @ApiProperty({ enum: Role, example: Role.Admin })
  created_by_role: Role;

  @ApiPropertyOptional({ example: null })
  finalized_at?: Date;

  @ApiPropertyOptional({ example: null })
  terminated_at?: Date;

  @ApiProperty({ example: '2026-10-04T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-10-04T12:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ type: [ConsentAuditLogResponseDto] })
  audit_logs?: ConsentAuditLogResponseDto[];
}

export class ConsentListResponseDto {
  @ApiProperty({ type: [ConsentResponseDto] })
  items: ConsentResponseDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  total_pages: number;
}

export class ConsentTypeGroupDto {
  @ApiProperty({ enum: ConsentType, example: ConsentType.OrderEdit })
  consent_type: ConsentType;

  @ApiProperty({ example: 'Edit Request' })
  label: string;

  @ApiProperty({ example: 2 })
  total_count: number;

  @ApiProperty({ example: true })
  has_active: boolean;

  @ApiPropertyOptional({ type: ConsentResponseDto })
  active_consent?: ConsentResponseDto | null;

  @ApiProperty({ type: [ConsentResponseDto] })
  items: ConsentResponseDto[];
}

export class GroupedConsentResponseDto {
  @ApiProperty({ enum: ConsentEntityType, example: ConsentEntityType.Order })
  entity_type: ConsentEntityType;

  @ApiProperty({ example: 42 })
  entity_id: number;

  @ApiProperty({ example: 10 })
  total_consents: number;

  @ApiProperty({ type: [ConsentTypeGroupDto] })
  groups: ConsentTypeGroupDto[];
}
