import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  ConsentAction,
  ConsentEntityType,
  ConsentRole,
  ConsentStatus,
  ConsentStep,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { JwtPayload } from 'src/services/jwt/interfaces/jwt-payload.interface';
import { CreateOrderEditConsentDto } from './dto/create-order-edit-consent.dto';
import { ConsentActionDto, ConsentRejectDto } from './dto/consent-action.dto';
import { ConsentQueryDto } from './dto/consent-query.dto';
import { ConsentActionDispatcherService } from './handlers/consent-action-dispatcher.service';

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: ConsentActionDispatcherService,
  ) {}

  /**
   * Helper to verify if an admin has a specific ConsentRole.
   * SuperAdmin has full bypass authority across all steps.
   */
  private async verifyCallerConsentRole(
    caller: JwtPayload,
    requiredRole: ConsentRole,
  ): Promise<void> {
    if (caller.type === Role.SuperAdmin) {
      return;
    }

    if (caller.type !== Role.Admin) {
      throw new ForbiddenException(
        `Insufficient permissions. Only Administrators with '${requiredRole}' role can perform this action.`,
      );
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: caller.id },
      select: { id: true, is_deleted: true, consent_roles: true },
    });

    if (!admin || admin.is_deleted) {
      throw new ForbiddenException('Admin account is inactive or not found.');
    }

    if (!admin.consent_roles.includes(requiredRole)) {
      throw new ForbiddenException(
        `Action requires '${requiredRole}' consent role. Your assigned consent roles: [${admin.consent_roles.join(', ') || 'None'}].`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Create Consent Request (Order Edit)
  // ─────────────────────────────────────────────────────────────────────────

  async createOrderEditConsent(
    dto: CreateOrderEditConsentDto,
    caller: JwtPayload,
  ) {
    // 1. Edge Case: Verify proposed changes are not empty
    const changes = dto.changes || {};
    const hasDefinedChanges = Object.values(changes).some(
      (val) => val !== undefined && val !== null,
    );

    if (!hasDefinedChanges) {
      throw new BadRequestException(
        'At least one valid order field modification must be provided in changes.',
      );
    }

    // 2. Edge Case: Check order existence
    const order = await this.prisma.order.findUnique({
      where: { id: dto.order_id },
      include: {
        driver: { select: { id: true, driver_name: true } },
        vehicle: { select: { id: true, registration_number: true } },
        vendor: { select: { id: true, vendor_name: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.order_id} was not found.`);
    }

    // 3. Edge Case: Prevent duplicate pending consent requests for the same order
    const existingActiveConsent = await this.prisma.consent_request.findFirst({
      where: {
        entity_type: ConsentEntityType.OrderEdit,
        entity_id: dto.order_id,
        status: {
          in: [
            ConsentStatus.PendingApproval,
            ConsentStatus.PendingVerification,
            ConsentStatus.PendingFinalization,
          ],
        },
      },
      select: { id: true, status: true, current_step: true },
    });

    if (existingActiveConsent) {
      throw new BadRequestException(
        `Order #${dto.order_id} already has an active consent request (#${existingActiveConsent.id} - ${existingActiveConsent.status} at step ${existingActiveConsent.current_step}). Please complete or terminate it before creating a new one.`,
      );
    }

    // Capture original snapshot for diffing and audit comparison
    const originalPayload: Record<string, any> = {
      status: order.status,
      remarks: order.remarks,
      cancel_reason: order.cancel_reason,
      discount_amount: order.discount_amount,
      final_amount: order.final_amount,
      driver_id: order.driver_id,
      vehicle_id: order.vehicle_id,
      vendor_id: order.vendor_id,
      service_id: order.service_id,
      sub_service_id: order.sub_service_id,
      fleet_type: order.fleet_type,
      is_physical_vcrf_for_pickup: order.is_physical_vcrf_for_pickup,
      is_physical_vcrf_for_dropoff: order.is_physical_vcrf_for_dropoff,
    };

    return this.prisma.$transaction(async (tx) => {
      const consent = await tx.consent_request.create({
        data: {
          entity_type: ConsentEntityType.OrderEdit,
          entity_id: dto.order_id,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          proposed_payload: dto.changes as any,
          original_payload: originalPayload,
          status: ConsentStatus.PendingApproval,
          current_step: ConsentStep.Approval,
          created_by_id: caller.id,
          created_by_role: caller.type,
        },
      });

      await tx.consent_audit_log.create({
        data: {
          consent_request_id: consent.id,
          step: ConsentStep.Approval,
          action: ConsentAction.Submit,
          previous_status: ConsentStatus.PendingApproval,
          new_status: ConsentStatus.PendingApproval,
          performed_by_id: caller.id,
          performed_by_role: caller.type,
          actor_consent_role: ConsentRole.Approver,
          remarks: 'Consent request created and submitted for Step 2 (Approval).',
        },
      });

      return consent;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Consent Approval (Role: Approver)
  // ─────────────────────────────────────────────────────────────────────────

  async approve(id: number, dto: ConsentActionDto, caller: JwtPayload) {
    const consent = await this.prisma.consent_request.findUnique({
      where: { id },
    });

    if (!consent) {
      throw new NotFoundException(`Consent request with ID ${id} was not found.`);
    }

    if (
      consent.status !== ConsentStatus.PendingApproval ||
      consent.current_step !== ConsentStep.Approval
    ) {
      throw new BadRequestException(
        `Consent cannot be approved. It is currently in status '${consent.status}' and step '${consent.current_step}'.`,
      );
    }

    // Edge Case: Prevent creator from self-approving (unless SuperAdmin)
    if (
      consent.created_by_id === caller.id &&
      consent.created_by_role === caller.type &&
      caller.type !== Role.SuperAdmin
    ) {
      throw new ForbiddenException(
        'Self-approval is forbidden. Another administrator must approve this consent request.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.consent_request.update({
        where: { id },
        data: {
          status: ConsentStatus.PendingVerification,
          current_step: ConsentStep.Verification,
        },
      });

      await tx.consent_audit_log.create({
        data: {
          consent_request_id: id,
          step: ConsentStep.Approval,
          action: ConsentAction.Approve,
          previous_status: ConsentStatus.PendingApproval,
          new_status: ConsentStatus.PendingVerification,
          performed_by_id: caller.id,
          performed_by_role: caller.type,
          actor_consent_role: ConsentRole.Approver,
          remarks:
            dto.remarks?.trim() ||
            'Consent approved at Step 2. Advanced to Step 3 (Verification).',
        },
      });

      return updated;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Consent Verification (Role: Verifier)
  // ─────────────────────────────────────────────────────────────────────────

  async verify(id: number, dto: ConsentActionDto, caller: JwtPayload) {
    const consent = await this.prisma.consent_request.findUnique({
      where: { id },
    });

    if (!consent) {
      throw new NotFoundException(`Consent request with ID ${id} was not found.`);
    }

    if (
      consent.status !== ConsentStatus.PendingVerification ||
      consent.current_step !== ConsentStep.Verification
    ) {
      throw new BadRequestException(
        `Consent cannot be verified. It is currently in status '${consent.status}' and step '${consent.current_step}'.`,
      );
    }

    // Edge Case: Prevent creator from self-verifying (unless SuperAdmin)
    if (
      consent.created_by_id === caller.id &&
      consent.created_by_role === caller.type &&
      caller.type !== Role.SuperAdmin
    ) {
      throw new ForbiddenException(
        'Self-verification is forbidden. Another administrator must verify this consent request.',
      );
    }

    // Edge Case: Separation of duties - approver who approved Step 2 cannot verify Step 3
    if (caller.type !== Role.SuperAdmin) {
      const step2Approval = await this.prisma.consent_audit_log.findFirst({
        where: {
          consent_request_id: id,
          step: ConsentStep.Approval,
          action: ConsentAction.Approve,
          performed_by_id: caller.id,
        },
        orderBy: { created_at: 'desc' },
      });

      if (step2Approval) {
        throw new ForbiddenException(
          'Separation of duties violation: The administrator who approved Step 2 cannot verify Step 3 for the same request.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.consent_request.update({
        where: { id },
        data: {
          status: ConsentStatus.PendingFinalization,
          current_step: ConsentStep.Finalization,
        },
      });

      await tx.consent_audit_log.create({
        data: {
          consent_request_id: id,
          step: ConsentStep.Verification,
          action: ConsentAction.Verify,
          previous_status: ConsentStatus.PendingVerification,
          new_status: ConsentStatus.PendingFinalization,
          performed_by_id: caller.id,
          performed_by_role: caller.type,
          actor_consent_role: ConsentRole.Verifier,
          remarks:
            dto.remarks?.trim() ||
            'Consent verified at Step 3. Advanced to Step 4 (Finalization).',
        },
      });

      return updated;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Consent Finalization (Role: Finalizer) -> PERMISSION GRANTED
  // ─────────────────────────────────────────────────────────────────────────

  async finalize(id: number, dto: ConsentActionDto, caller: JwtPayload) {
    const consent = await this.prisma.consent_request.findUnique({
      where: { id },
    });

    if (!consent) {
      throw new NotFoundException(`Consent request with ID ${id} was not found.`);
    }

    if (
      consent.status !== ConsentStatus.PendingFinalization ||
      consent.current_step !== ConsentStep.Finalization
    ) {
      throw new BadRequestException(
        `Consent cannot be finalized. It is currently in status '${consent.status}' and step '${consent.current_step}'.`,
      );
    }

    // Edge Case: Prevent creator from self-finalizing (unless SuperAdmin)
    if (
      consent.created_by_id === caller.id &&
      consent.created_by_role === caller.type &&
      caller.type !== Role.SuperAdmin
    ) {
      throw new ForbiddenException(
        'Self-finalization is forbidden. Another administrator must finalize this consent request.',
      );
    }

    // Edge Case: Separation of duties - verifier who verified Step 3 cannot finalize Step 4
    if (caller.type !== Role.SuperAdmin) {
      const step3Verification = await this.prisma.consent_audit_log.findFirst({
        where: {
          consent_request_id: id,
          step: ConsentStep.Verification,
          action: ConsentAction.Verify,
          performed_by_id: caller.id,
        },
        orderBy: { created_at: 'desc' },
      });

      if (step3Verification) {
        throw new ForbiddenException(
          'Separation of duties violation: The administrator who verified Step 3 cannot finalize Step 4 for the same request.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.consent_request.update({
        where: { id },
        data: {
          status: ConsentStatus.PermissionGranted,
          finalized_at: new Date(),
        },
      });

      await tx.consent_audit_log.create({
        data: {
          consent_request_id: id,
          step: ConsentStep.Finalization,
          action: ConsentAction.Finalize,
          previous_status: ConsentStatus.PendingFinalization,
          new_status: ConsentStatus.PermissionGranted,
          performed_by_id: caller.id,
          performed_by_role: caller.type,
          actor_consent_role: ConsentRole.Finalizer,
          remarks:
            dto.remarks?.trim() ||
            'Consent finalized at Step 4. Permission Granted. Executing changes.',
        },
      });

      // Execute committed action via handler dispatcher inside the same transaction
      await this.dispatcher.dispatch(updated, tx);

      return updated;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REJECTION FLOW (Multi-Level Backtracking / Termination)
  // ─────────────────────────────────────────────────────────────────────────

  async reject(id: number, dto: ConsentRejectDto, caller: JwtPayload) {
    const trimmedReason = dto.reason?.trim();
    if (!trimmedReason) {
      throw new BadRequestException('A valid rejection reason must be provided.');
    }

    const consent = await this.prisma.consent_request.findUnique({
      where: { id },
    });

    if (!consent) {
      throw new NotFoundException(`Consent request with ID ${id} was not found.`);
    }

    if (
      consent.status === ConsentStatus.PermissionGranted ||
      consent.status === ConsentStatus.Terminated
    ) {
      throw new BadRequestException(
        `Cannot reject a consent in terminal status '${consent.status}'.`,
      );
    }

    // Edge Case: Validate that the caller has the role corresponding to the current step
    let requiredRole: ConsentRole;
    let newStatus: ConsentStatus;
    let nextStep: ConsentStep;
    let actorRole: ConsentRole;

    if (consent.current_step === ConsentStep.Approval) {
      requiredRole = ConsentRole.Approver;
      // Step 2 Rejection: Whole consent process terminates
      newStatus = ConsentStatus.Terminated;
      nextStep = ConsentStep.Approval;
      actorRole = ConsentRole.Approver;
    } else if (consent.current_step === ConsentStep.Verification) {
      requiredRole = ConsentRole.Verifier;
      // Step 3 Rejection: Moves back to Step 2 (Approval)
      newStatus = ConsentStatus.PendingApproval;
      nextStep = ConsentStep.Approval;
      actorRole = ConsentRole.Verifier;
    } else if (consent.current_step === ConsentStep.Finalization) {
      requiredRole = ConsentRole.Finalizer;
      // Step 4 Rejection: Moves back to Step 3 (Verification)
      newStatus = ConsentStatus.PendingVerification;
      nextStep = ConsentStep.Verification;
      actorRole = ConsentRole.Finalizer;
    } else {
      throw new BadRequestException(`Unrecognized consent step '${consent.current_step}'.`);
    }

    // Verify role permissions for this step
    await this.verifyCallerConsentRole(caller, requiredRole);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.consent_request.update({
        where: { id },
        data: {
          status: newStatus,
          current_step: nextStep,
          terminated_at: newStatus === ConsentStatus.Terminated ? new Date() : null,
        },
      });

      await tx.consent_audit_log.create({
        data: {
          consent_request_id: id,
          step: consent.current_step,
          action: ConsentAction.Reject,
          previous_status: consent.status,
          new_status: newStatus,
          performed_by_id: caller.id,
          performed_by_role: caller.type,
          actor_consent_role: actorRole,
          remarks: trimmedReason,
        },
      });

      return updated;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Querying & Auditing
  // ─────────────────────────────────────────────────────────────────────────

  async findAll(query: ConsentQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.consent_requestWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.current_step) where.current_step = query.current_step;
    if (query.entity_type) where.entity_type = query.entity_type;
    if (query.entity_id) where.entity_id = Number(query.entity_id);

    const [items, total] = await Promise.all([
      this.prisma.consent_request.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          audit_logs: {
            orderBy: { created_at: 'desc' },
            take: 1, // Include latest log in summary
          },
        },
      }),
      this.prisma.consent_request.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    };
  }

  async findById(id: number) {
    const consent = await this.prisma.consent_request.findUnique({
      where: { id },
    });

    if (!consent) {
      throw new NotFoundException(`Consent request with ID ${id} was not found.`);
    }

    return consent;
  }

  async getAuditLogs(id: number) {
    const consent = await this.prisma.consent_request.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!consent) {
      throw new NotFoundException(`Consent request with ID ${id} was not found.`);
    }

    return this.prisma.consent_audit_log.findMany({
      where: { consent_request_id: id },
      orderBy: { created_at: 'asc' },
    });
  }
}
