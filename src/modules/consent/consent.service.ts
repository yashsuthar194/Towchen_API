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
  ConsentType,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { JwtPayload } from 'src/services/jwt/interfaces/jwt-payload.interface';
import { CreateOrderEditConsentDto } from './dto/create-order-edit-consent.dto';
import { CreateConsentDto } from './dto/create-consent.dto';
import { ConsentActionDto, ConsentRejectDto } from './dto/consent-action.dto';
import { ConsentQueryDto } from './dto/consent-query.dto';
import { ConsentActionDispatcherService } from './handlers/consent-action-dispatcher.service';

/**
 * Standard mapping of Parent Entities to their supported Consent Types and UI labels.
 */
export const ENTITY_CONSENT_TYPE_MAP: Record<
  ConsentEntityType,
  { type: ConsentType; label: string }[]
> = {
  [ConsentEntityType.Order]: [
    { type: ConsentType.NewOrder, label: 'New Order' },
    { type: ConsentType.ManualOrderAssign, label: 'Manual Order Assign Request' },
    { type: ConsentType.OrderEdit, label: 'Edit Request' },
    { type: ConsentType.OrderClosure, label: 'Closure Request' },
    { type: ConsentType.OrderFinance, label: 'Finance Request' },
  ],
  [ConsentEntityType.Vendor]: [
    { type: ConsentType.VendorRegistration, label: 'New Vendor Registration' },
    { type: ConsentType.VendorWalletSettlement, label: 'Payment Settlement (Vendor Wallet)' },
  ],
  [ConsentEntityType.Driver]: [
    { type: ConsentType.DriverRegistration, label: 'New Driver Registration' },
  ],
  [ConsentEntityType.Vehicle]: [
    { type: ConsentType.VehicleRegistration, label: 'New Vehicle Registration' },
  ],
  [ConsentEntityType.Subscription]: [
    { type: ConsentType.SubscriptionPlanReview, label: 'Subscription Plan Review' },
  ],
  [ConsentEntityType.ManualPackage]: [
    { type: ConsentType.ManualPackagePlanReview, label: 'Manual Package Plan Review' },
  ],
  [ConsentEntityType.ServiceLocation]: [
    { type: ConsentType.ServiceLocation, label: 'New Service Location Request' },
  ],
};

/**
 * Precomputed Set of active consent statuses for O(1) membership checks.
 */
const ACTIVE_CONSENT_STATUS_SET = new Set<ConsentStatus>([
  ConsentStatus.PendingApproval,
  ConsentStatus.PendingVerification,
  ConsentStatus.PendingFinalization,
]);

/**
 * Precomputed Map of all known consent types to their display labels for O(1) lookup.
 */
const GLOBAL_CONSENT_LABEL_MAP = new Map<ConsentType, string>();
for (const list of Object.values(ENTITY_CONSENT_TYPE_MAP)) {
  for (const item of list) {
    GLOBAL_CONSENT_LABEL_MAP.set(item.type, item.label);
  }
}

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
  // STEP 1: Create Consent Request (Universal endpoint & specialized helper)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Universal creation method for all 12 consent types across Orders, Vendors,
   * Drivers, Vehicles, Subscriptions, Packages, and Locations.
   */
  async createConsent(dto: CreateConsentDto, caller: JwtPayload) {
    // 1. Verify that consent_type belongs to entity_type
    const allowedTypes =
      ENTITY_CONSENT_TYPE_MAP[dto.entity_type]?.map((item) => item.type) || [];
    if (!allowedTypes.includes(dto.consent_type)) {
      throw new BadRequestException(
        `Consent type '${dto.consent_type}' is not valid for entity '${dto.entity_type}'. Allowed types: [${allowedTypes.join(', ')}].`,
      );
    }

    // 2. Validate entity_id for types operating on existing records
    const typesRequiringEntityId = new Set<ConsentType>([
      ConsentType.OrderEdit,
      ConsentType.OrderClosure,
      ConsentType.ManualOrderAssign,
      ConsentType.OrderFinance,
      ConsentType.VendorWalletSettlement,
    ]);

    if (typesRequiringEntityId.has(dto.consent_type) && !dto.entity_id) {
      throw new BadRequestException(
        `Field 'entity_id' is required for consent type '${dto.consent_type}'.`,
      );
    }

    // 3. Verify proposed_payload is non-empty
    const payload = dto.proposed_payload || {};
    const hasDefinedChanges = Object.values(payload).some(
      (val) => val !== undefined && val !== null,
    );

    if (!hasDefinedChanges) {
      throw new BadRequestException(
        'At least one valid field modification must be provided in proposed_payload.',
      );
    }

    let originalPayload: Record<string, any> | null = null;

    // 4. If entity_id is provided, validate target existence and prevent active duplicates
    if (dto.entity_id) {
      const existingActiveConsent = await this.prisma.consent_request.findFirst({
        where: {
          entity_type: dto.entity_type,
          entity_id: dto.entity_id,
          consent_type: dto.consent_type,
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
          `An active '${dto.consent_type}' consent request (#${existingActiveConsent.id} - ${existingActiveConsent.status} at step ${existingActiveConsent.current_step}) is already pending for ${dto.entity_type} #${dto.entity_id}. Please complete or terminate it before creating a new one.`,
        );
      }

      // Snapshot original entity state based on entity_type
      if (dto.entity_type === ConsentEntityType.Order) {
        const order = await this.prisma.order.findUnique({
          where: { id: dto.entity_id },
        });

        if (!order) {
          throw new NotFoundException(`Order with ID ${dto.entity_id} was not found.`);
        }

        originalPayload = {
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
      } else if (dto.entity_type === ConsentEntityType.Vendor) {
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: dto.entity_id },
        });

        if (!vendor) {
          throw new NotFoundException(`Vendor with ID ${dto.entity_id} was not found.`);
        }

        originalPayload = {
          organization_name: vendor.organization_name,
          mobile_number: vendor.mobile_number,
          email: vendor.email,
          status: vendor.status,
          is_deleted: vendor.is_deleted,
        };
      } else if (dto.entity_type === ConsentEntityType.Driver) {
        const driver = await this.prisma.driver.findUnique({
          where: { id: dto.entity_id },
        });

        if (!driver) {
          throw new NotFoundException(`Driver with ID ${dto.entity_id} was not found.`);
        }

        originalPayload = {
          driver_name: driver.driver_name,
          mobile_number: driver.mobile_number,
          status: driver.status,
          is_deleted: driver.is_deleted,
        };
      } else if (dto.entity_type === ConsentEntityType.Vehicle) {
        const vehicle = await this.prisma.vehicle.findUnique({
          where: { id: dto.entity_id },
        });

        if (!vehicle) {
          throw new NotFoundException(`Vehicle with ID ${dto.entity_id} was not found.`);
        }

        originalPayload = {
          registration_number: vehicle.registration_number,
          status: vehicle.status,
          is_deleted: vehicle.is_deleted,
        };
      } else if (dto.entity_type === ConsentEntityType.Subscription) {
        const plan = await this.prisma.subscription_plan.findUnique({
          where: { id: dto.entity_id },
        });

        if (!plan) {
          throw new NotFoundException(
            `Subscription plan with ID ${dto.entity_id} was not found.`,
          );
        }

        originalPayload = {
          name: plan.name,
          pricing: plan.pricing,
          plan_period_months: plan.plan_period_months,
          incidents: plan.incidents,
          distance_km: plan.distance_km,
          vehicle_type: plan.vehicle_type,
          is_active: plan.is_active,
        };
      } else if (dto.entity_type === ConsentEntityType.ManualPackage) {
        const pkg = await this.prisma.dealer_package_plan.findUnique({
          where: { id: dto.entity_id },
        });

        if (!pkg) {
          throw new NotFoundException(
            `Dealer package plan with ID ${dto.entity_id} was not found.`,
          );
        }

        originalPayload = {
          name: pkg.name,
          plan_period_months: pkg.plan_period_months,
          incidents: pkg.incidents,
          distance_km: pkg.distance_km,
          price_basic: pkg.price_basic,
          price_standard: pkg.price_standard,
          price_premium: pkg.price_premium,
          is_active: pkg.is_active,
        };
      } else if (dto.entity_type === ConsentEntityType.ServiceLocation) {
        const loc = await this.prisma.location.findUnique({
          where: { id: dto.entity_id },
        });

        if (!loc) {
          throw new NotFoundException(`Location with ID ${dto.entity_id} was not found.`);
        }

        originalPayload = {
          city: loc.city,
          state: loc.state,
          area: loc.area,
          address: loc.address,
          latitude: loc.latitude,
          longitude: loc.longitude,
        };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const consent = await tx.consent_request.create({
        data: {
          entity_type: dto.entity_type,
          entity_id: dto.entity_id || null,
          consent_type: dto.consent_type,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          proposed_payload: dto.proposed_payload as any,
          original_payload: (originalPayload as Prisma.InputJsonValue) ?? Prisma.JsonNull,
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
          remarks: `Consent request created and submitted for ${dto.consent_type} (Step 2 Approval).`,
        },
      });

      return consent;
    });
  }

  /**
   * Helper method for order edit consent creation.
   */
  async createOrderEditConsent(
    dto: CreateOrderEditConsentDto,
    caller: JwtPayload,
  ) {
    return this.createConsent(
      {
        entity_type: ConsentEntityType.Order,
        entity_id: dto.order_id,
        consent_type: ConsentType.OrderEdit,
        title: dto.title,
        description: dto.description,
        proposed_payload: dto.changes,
      },
      caller,
    );
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
    if (query.consent_type) where.consent_type = query.consent_type;
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

  /**
   * Fetches all ongoing and past consents grouped by consent_type.
   * Only groups that actually have created records are returned.
   * If no consents exist for the filter, groups is an empty array [].
   */
  async findGrouped(entityType?: ConsentEntityType, entityId?: number) {
    const where: Prisma.consent_requestWhereInput = {};
    if (entityType) where.entity_type = entityType;
    if (entityId !== undefined && entityId !== null) where.entity_id = Number(entityId);

    // Memory safeguard: if no filters are provided, cap at 100 to prevent unbounded memory growth
    const take = !entityType && (entityId === undefined || entityId === null) ? 100 : undefined;

    const allConsents = await this.prisma.consent_request.findMany({
      where,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        audit_logs: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (allConsents.length === 0) {
      return {
        entity_type: entityType || null,
        entity_id: entityId !== undefined && entityId !== null ? Number(entityId) : null,
        total_consents: 0,
        groups: [],
      };
    }

    // Group only created consents by consent_type in a single pass
    const groupsMap = new Map<
      ConsentType,
      {
        consent_type: ConsentType;
        label: string;
        total_count: number;
        has_active: boolean;
        active_consent: (typeof allConsents)[0] | null;
        items: typeof allConsents;
      }
    >();

    for (let i = 0; i < allConsents.length; i++) {
      const c = allConsents[i];
      let group = groupsMap.get(c.consent_type);

      if (!group) {
        group = {
          consent_type: c.consent_type,
          label: GLOBAL_CONSENT_LABEL_MAP.get(c.consent_type) || c.consent_type,
          total_count: 0,
          has_active: false,
          active_consent: null,
          items: [],
        };
        groupsMap.set(c.consent_type, group);
      }

      group.items.push(c);
      group.total_count++;

      if (!group.active_consent && ACTIVE_CONSENT_STATUS_SET.has(c.status)) {
        group.active_consent = c;
        group.has_active = true;
      }
    }

    return {
      entity_type: entityType || null,
      entity_id: entityId !== undefined && entityId !== null ? Number(entityId) : null,
      total_consents: allConsents.length,
      groups: Array.from(groupsMap.values()),
    };
  }

  /**
   * Backwards compatible alias for findGrouped
   */
  async findGroupedByEntity(entityType: ConsentEntityType, entityId: number) {
    return this.findGrouped(entityType, entityId);
  }
}
