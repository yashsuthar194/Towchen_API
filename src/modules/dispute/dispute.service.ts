import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { StorageService } from 'src/services/storage/storage.service';
import {
  DisputeType,
  DisputeStatus,
  DisputeStep,
  DisputeAction,
  DisputeRole,
  OrderStatus,
  Role,
  ConsentEntityType,
  ConsentType,
} from '@prisma/client';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { VerifyDisputeDto } from './dto/verify-dispute.dto';
import { DisputeActionDto } from './dto/dispute-action.dto';
import { RejectDisputeDto } from './dto/reject-dispute.dto';
import { DisputeQueryDto } from './dto/dispute-query.dto';
import { JwtPayload } from 'src/services/jwt/interfaces/jwt-payload.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // ROLE VERIFICATION HELPER (Matching CMS Pattern)
  // ─────────────────────────────────────────────────────────────────────────

  private async verifyCallerDisputeRole(
    caller: JwtPayload,
    requiredRole: DisputeRole,
  ): Promise<void> {
    if (caller.type === Role.SuperAdmin) {
      return;
    }

    if (caller.type !== Role.Admin) {
      throw new ForbiddenException(
        `Action requires '${requiredRole}' role. Only Administrators can perform this action.`,
      );
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: caller.id },
      select: { id: true, is_deleted: true, dispute_roles: true, consent_roles: true },
    });

    if (!admin || admin.is_deleted) {
      throw new ForbiddenException('Admin account is inactive or not found.');
    }

    const hasDirectRole = admin.dispute_roles && admin.dispute_roles.includes(requiredRole);
    const hasConsentRoleFallback =
      admin.consent_roles && admin.consent_roles.includes(requiredRole as any);

    if (!hasDirectRole && !hasConsentRoleFallback) {
      throw new ForbiddenException(
        `Action requires '${requiredRole}' dispute role. Your current dispute roles: [${(admin.dispute_roles || []).join(', ') || 'None'}].`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: CREATE DISPUTE (Vendor Only)
  // ─────────────────────────────────────────────────────────────────────────

  async createDispute(
    dto: CreateDisputeDto,
    caller: JwtPayload,
    files?: Express.Multer.File[],
  ) {
    // 1. Resolve vendor identity
    let vendorId: number;
    if (caller.type === Role.Vendor) {
      vendorId = caller.id;
    } else if (caller.type === Role.SuperAdmin || caller.type === Role.Admin) {
      // If admin creates on behalf of vendor, infer from order
      const targetOrder = await this.prisma.order.findUnique({
        where: { id: dto.order_id },
        select: { vendor_id: true },
      });
      if (!targetOrder?.vendor_id) {
        throw new BadRequestException('Target order does not have an assigned vendor.');
      }
      vendorId = targetOrder.vendor_id;
    } else {
      throw new ForbiddenException('Only vendors can submit dispute requests.');
    }

    // 2. Validate Order existence and ownership
    const order = await this.prisma.order.findUnique({
      where: { id: dto.order_id },
      select: {
        id: true,
        formated_id: true,
        vendor_id: true,
        status: true,
        completion_time: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order #${dto.order_id} was not found.`);
    }

    if (caller.type === Role.Vendor && order.vendor_id !== vendorId) {
      throw new ForbiddenException(
        'You can only submit dispute requests for orders assigned to your vendor account.',
      );
    }

    // 3. Validate Order status is Completed
    if (order.status !== OrderStatus.Completed) {
      throw new BadRequestException(
        `Dispute can only be raised for orders with status 'Completed'. Current order status is '${order.status}'.`,
      );
    }

    // 4. CRITICAL INTERLOCKING RULE: Check if CMS OrderClosure already initiated
    const existingClosureConsent = await this.prisma.consent_request.findFirst({
      where: {
        entity_type: ConsentEntityType.Order,
        entity_id: order.id,
        consent_type: ConsentType.OrderClosure,
      },
      select: { id: true, status: true, created_at: true },
    });

    if (existingClosureConsent) {
      throw new BadRequestException(
        `Dispute window for Order #${order.id} (${order.formated_id}) is closed. Order closure request (#${existingClosureConsent.id}) has already been generated in CMS.`,
      );
    }

    // 5. Check if an active dispute of the same type is already pending
    const existingPendingDispute = await this.prisma.dispute_request.findFirst({
      where: {
        order_id: order.id,
        dispute_type: dto.dispute_type,
        status: {
          in: [
            DisputeStatus.PendingResolution,
            DisputeStatus.PendingVerification,
            DisputeStatus.PendingFinalization,
          ],
        },
      },
      select: { id: true, formated_id: true, status: true, current_step: true },
    });

    if (existingPendingDispute) {
      throw new BadRequestException(
        `An active ${dto.dispute_type} (${existingPendingDispute.formated_id || '#' + existingPendingDispute.id}) is already ${existingPendingDispute.status} at step ${existingPendingDispute.current_step} for this order.`,
      );
    }

    // 6. Handle file uploads to S3
    const proofUrls: string[] = dto.proof_urls ? [...dto.proof_urls] : [];
    if (files && files.length > 0) {
      const uploadTasks = files.map((file, index) =>
        this.storageService.uploadFileAsync({
          buffer: file.buffer,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          folderPath: `disputes/proofs/${randomUUID()}/${index}`,
        }),
      );
      const uploadedFiles = await Promise.all(uploadTasks);
      proofUrls.push(...uploadedFiles.map((f) => f.url));
    }

    if (proofUrls.length === 0) {
      throw new BadRequestException(
        'At least one proof document / receipt image is required to raise a dispute.',
      );
    }

    // 7. Atomic creation in Database Transaction
    return this.prisma.$transaction(async (tx) => {
      const createdDispute = await tx.dispute_request.create({
        data: {
          formated_id: '', // Populated by DB trigger (DSP0000001)
          order_id: order.id,
          vendor_id: vendorId,
          dispute_type: dto.dispute_type,
          demanded_amount: dto.demanded_amount,
          approved_amount: dto.demanded_amount, // initially mirrors demanded amount until Verifier edits
          description: dto.description?.trim() || null,
          proof_urls: proofUrls,
          status: DisputeStatus.PendingResolution,
          current_step: DisputeStep.Resolution,
          created_by_id: caller.id,
        },
      });

      // Create Step 1 Audit Log
      await tx.dispute_audit_log.create({
        data: {
          dispute_request_id: createdDispute.id,
          step: DisputeStep.Resolution,
          action: DisputeAction.Submit,
          previous_status: DisputeStatus.PendingResolution,
          new_status: DisputeStatus.PendingResolution,
          performed_by_id: caller.id,
          performed_by_role: caller.type,
          actor_dispute_role: null,
          demanded_amount: dto.demanded_amount,
          approved_amount: dto.demanded_amount,
          remarks: dto.description?.trim() || 'Dispute submitted by vendor.',
          metadata: {
            order_id: order.id,
            order_formated_id: order.formated_id,
            dispute_type: dto.dispute_type,
            proof_count: proofUrls.length,
          },
        },
      });

      this.logger.log(
        `Dispute #${createdDispute.id} (${createdDispute.formated_id}) created for Order #${order.id} by Vendor #${vendorId}. Type: ${dto.dispute_type}, Demanded: ₹${dto.demanded_amount}. CMS Auto-Creation is now paused.`,
      );

      return createdDispute;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: RESOLUTION (Role: Resolver)
  // ─────────────────────────────────────────────────────────────────────────

  async resolve(id: number, dto: DisputeActionDto, caller: JwtPayload) {
    await this.verifyCallerDisputeRole(caller, DisputeRole.Resolver);

    const dispute = await this.prisma.dispute_request.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute #${id} was not found.`);
    }

    if (
      dispute.status !== DisputeStatus.PendingResolution ||
      dispute.current_step !== DisputeStep.Resolution
    ) {
      throw new BadRequestException(
        `Dispute #${id} cannot be resolved at current state (Status: ${dispute.status}, Step: ${dispute.current_step}). Expected: PendingResolution at step Resolution.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.dispute_request.update({
        where: { id },
        data: {
          status: DisputeStatus.PendingVerification,
          current_step: DisputeStep.Verification,
        },
      });

      await tx.dispute_audit_log.create({
        data: {
          dispute_request_id: id,
          step: DisputeStep.Resolution,
          action: DisputeAction.Resolve,
          previous_status: DisputeStatus.PendingResolution,
          new_status: DisputeStatus.PendingVerification,
          performed_by_id: caller.id,
          performed_by_role: caller.type,
          actor_dispute_role: DisputeRole.Resolver,
          demanded_amount: dispute.demanded_amount,
          approved_amount: dispute.approved_amount,
          remarks: dto.remarks?.trim() || 'Dispute resolved at Step 2 by Resolver.',
        },
      });

      this.logger.log(`Dispute #${id} (${dispute.formated_id}) resolved at Step 2 by Admin #${caller.id}.`);
      return updated;
    });
  }

  // Backward-compatible alias for Step 2
  async approve(id: number, dto: DisputeActionDto, caller: JwtPayload) {
    return this.resolve(id, dto, caller);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: VERIFICATION (Role: Verifier) — Price Adjustment Allowed!
  // ─────────────────────────────────────────────────────────────────────────

  async verify(id: number, dto: VerifyDisputeDto, caller: JwtPayload) {
    await this.verifyCallerDisputeRole(caller, DisputeRole.Verifier);

    const dispute = await this.prisma.dispute_request.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute #${id} was not found.`);
    }

    if (
      dispute.status !== DisputeStatus.PendingVerification ||
      dispute.current_step !== DisputeStep.Verification
    ) {
      throw new BadRequestException(
        `Dispute #${id} cannot be verified at current state (Status: ${dispute.status}, Step: ${dispute.current_step}). Expected: PendingVerification at step Verification.`,
      );
    }

    // Separation of duties: Verifier cannot be the admin who resolved at Step 2
    if (caller.type !== Role.SuperAdmin) {
      const step2Resolution = await this.prisma.dispute_audit_log.findFirst({
        where: {
          dispute_request_id: id,
          step: DisputeStep.Resolution,
          action: DisputeAction.Resolve,
          performed_by_id: caller.id,
        },
      });

      if (step2Resolution) {
        throw new ForbiddenException(
          'Separation of duties violation: The administrator who resolved Step 2 cannot verify Step 3 for the same dispute.',
        );
      }
    }

    // Determine the approved amount (Admin can modify or retain demanded amount)
    const finalApprovedAmount =
      dto.approved_amount !== undefined && dto.approved_amount !== null
        ? Number(dto.approved_amount)
        : dispute.approved_amount ?? dispute.demanded_amount;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.dispute_request.update({
        where: { id },
        data: {
          status: DisputeStatus.PendingFinalization,
          current_step: DisputeStep.Finalization,
          approved_amount: finalApprovedAmount,
        },
      });

      await tx.dispute_audit_log.create({
        data: {
          dispute_request_id: id,
          step: DisputeStep.Verification,
          action: DisputeAction.Verify,
          previous_status: DisputeStatus.PendingVerification,
          new_status: DisputeStatus.PendingFinalization,
          performed_by_id: caller.id,
          performed_by_role: caller.type,
          actor_dispute_role: DisputeRole.Verifier,
          demanded_amount: dispute.demanded_amount,
          approved_amount: finalApprovedAmount,
          remarks:
            dto.remarks?.trim() ||
            `Dispute verified at Step 3. Amount verified as ₹${finalApprovedAmount} (demanded: ₹${dispute.demanded_amount}).`,
          metadata: {
            original_demanded: dispute.demanded_amount,
            verified_amount: finalApprovedAmount,
            amount_adjusted: finalApprovedAmount !== dispute.demanded_amount,
          },
        },
      });

      this.logger.log(
        `Dispute #${id} (${dispute.formated_id}) verified at Step 3 by Admin #${caller.id}. Verified Amount: ₹${finalApprovedAmount}.`,
      );
      return updated;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: FINALIZATION (Role: Finalizer) -> Permission Granted
  // ─────────────────────────────────────────────────────────────────────────

  async finalize(id: number, dto: DisputeActionDto, caller: JwtPayload) {
    await this.verifyCallerDisputeRole(caller, DisputeRole.Finalizer);

    const dispute = await this.prisma.dispute_request.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute #${id} was not found.`);
    }

    if (
      dispute.status !== DisputeStatus.PendingFinalization ||
      dispute.current_step !== DisputeStep.Finalization
    ) {
      throw new BadRequestException(
        `Dispute #${id} cannot be finalized at current state (Status: ${dispute.status}, Step: ${dispute.current_step}). Expected: PendingFinalization at step Finalization.`,
      );
    }

    // Separation of duties: Finalizer cannot be the admin who verified at Step 3
    if (caller.type !== Role.SuperAdmin) {
      const step3Verification = await this.prisma.dispute_audit_log.findFirst({
        where: {
          dispute_request_id: id,
          step: DisputeStep.Verification,
          action: DisputeAction.Verify,
          performed_by_id: caller.id,
        },
      });

      if (step3Verification) {
        throw new ForbiddenException(
          'Separation of duties violation: The administrator who verified Step 3 cannot finalize Step 4 for the same dispute.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.dispute_request.update({
        where: { id },
        data: {
          status: DisputeStatus.PermissionGranted,
          finalized_at: now,
        },
      });

      await tx.dispute_audit_log.create({
        data: {
          dispute_request_id: id,
          step: DisputeStep.Finalization,
          action: DisputeAction.Finalize,
          previous_status: DisputeStatus.PendingFinalization,
          new_status: DisputeStatus.PermissionGranted,
          performed_by_id: caller.id,
          performed_by_role: caller.type,
          actor_dispute_role: DisputeRole.Finalizer,
          demanded_amount: dispute.demanded_amount,
          approved_amount: dispute.approved_amount,
          remarks:
            dto.remarks?.trim() ||
            'Dispute finalized at Step 4. Permission Granted. Final dispute amount resolved.',
        },
      });

      this.logger.log(
        `Dispute #${id} (${dispute.formated_id}) finalized at Step 4 by Admin #${caller.id}. Status: PermissionGranted, Approved Amount: ₹${dispute.approved_amount}. 24-hour countdown for Order #${dispute.order_id} closure begins now.`,
      );
      return updated;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REJECTION / TERMINATION FLOW
  // ─────────────────────────────────────────────────────────────────────────

  async reject(id: number, dto: RejectDisputeDto, caller: JwtPayload) {
    const dispute = await this.prisma.dispute_request.findUnique({
      where: { id },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute #${id} was not found.`);
    }

    if (
      dispute.status === DisputeStatus.PermissionGranted ||
      dispute.status === DisputeStatus.Terminated
    ) {
      throw new BadRequestException(
        `Dispute #${id} is already in terminal state '${dispute.status}'. Cannot be rejected.`,
      );
    }

    // Verify caller role for the current step
    let requiredRole: DisputeRole;
    if (dispute.current_step === DisputeStep.Resolution) {
      requiredRole = DisputeRole.Resolver;
    } else if (dispute.current_step === DisputeStep.Verification) {
      requiredRole = DisputeRole.Verifier;
    } else {
      requiredRole = DisputeRole.Finalizer;
    }

    await this.verifyCallerDisputeRole(caller, requiredRole);

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.dispute_request.update({
        where: { id },
        data: {
          status: DisputeStatus.Terminated,
          terminated_at: now,
        },
      });

      await tx.dispute_audit_log.create({
        data: {
          dispute_request_id: id,
          step: dispute.current_step,
          action: DisputeAction.Reject,
          previous_status: dispute.status,
          new_status: DisputeStatus.Terminated,
          performed_by_id: caller.id,
          performed_by_role: caller.type,
          actor_dispute_role: requiredRole,
          demanded_amount: dispute.demanded_amount,
          approved_amount: dispute.approved_amount,
          remarks: dto.remarks.trim(),
        },
      });

      this.logger.log(
        `Dispute #${id} (${dispute.formated_id}) terminated/rejected by Admin #${caller.id}. Reason: "${dto.remarks.trim()}". 24-hour countdown for Order #${dispute.order_id} closure begins now.`,
      );
      return updated;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // READ / QUERY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  async findAll(query: DisputeQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.dispute_type) where.dispute_type = query.dispute_type;
    if (query.order_id) where.order_id = query.order_id;
    if (query.vendor_id) where.vendor_id = query.vendor_id;

    const [total, items] = await Promise.all([
      this.prisma.dispute_request.count({ where }),
      this.prisma.dispute_request.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              formated_id: true,
              status: true,
              completion_time: true,
            },
          },
          vendor: {
            select: {
              id: true,
              formated_id: true,
              vendor_name: true,
              mobile_number: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number) {
    const dispute = await this.prisma.dispute_request.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            formated_id: true,
            status: true,
            completion_time: true,
            fleet_type: true,
            created_at: true,
          },
        },
        vendor: {
          select: {
            id: true,
            formated_id: true,
            vendor_name: true,
            organization_name: true,
            mobile_number: true,
            email: true,
          },
        },
        audit_logs: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute #${id} was not found.`);
    }

    return dispute;
  }

  async findByVendor(vendorId: number, query: DisputeQueryDto) {
    query.vendor_id = vendorId;
    return this.findAll(query);
  }

  async getAuditLogs(id: number) {
    const dispute = await this.prisma.dispute_request.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute #${id} was not found.`);
    }

    return this.prisma.dispute_audit_log.findMany({
      where: { dispute_request_id: id },
      orderBy: { created_at: 'asc' },
    });
  }
}
