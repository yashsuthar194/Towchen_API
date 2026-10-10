import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ConsentAction,
  ConsentEntityType,
  ConsentRole,
  ConsentStatus,
  ConsentStep,
  ConsentType,
  Role,
} from '@prisma/client';
import { ConsentService } from './consent.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ConsentActionDispatcherService } from './handlers/consent-action-dispatcher.service';

describe('ConsentService', () => {
  let service: ConsentService;
  let prisma: any;
  let dispatcher: any;

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
      },
      admin: {
        findUnique: jest.fn(),
      },
      consent_request: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      consent_audit_log: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    dispatcher = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConsentActionDispatcherService, useValue: dispatcher },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);
  });

  describe('Step 1: createOrderEditConsent', () => {
    it('should throw BadRequestException if changes payload is empty or has only undefined values', async () => {
      await expect(
        service.createOrderEditConsent(
          { order_id: 10, title: 'Edit order', changes: {} as any },
          { id: 1, email: 'admin@towchen.com', type: Role.Admin },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if target order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createOrderEditConsent(
          { order_id: 999, title: 'Edit order', changes: { remarks: 'test' } },
          { id: 1, email: 'admin@towchen.com', type: Role.Admin },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order already has an active consent request', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 10 });
      prisma.consent_request.findFirst.mockResolvedValue({
        id: 55,
        status: ConsentStatus.PendingApproval,
        current_step: ConsentStep.Approval,
      });

      await expect(
        service.createOrderEditConsent(
          { order_id: 10, title: 'Edit order', changes: { remarks: 'test' } },
          { id: 1, email: 'admin@towchen.com', type: Role.Admin },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a consent request with PendingApproval and Approval step', async () => {
      const mockOrder = {
        id: 10,
        status: 'New',
        remarks: 'Original remark',
        final_amount: 1000,
        discount_amount: 0,
      };
      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.consent_request.findFirst.mockResolvedValue(null);

      const createdConsent = {
        id: 1,
        status: ConsentStatus.PendingApproval,
        current_step: ConsentStep.Approval,
      };
      prisma.consent_request.create.mockResolvedValue(createdConsent);
      prisma.consent_audit_log.create.mockResolvedValue({});

      const result = await service.createOrderEditConsent(
        {
          order_id: 10,
          title: 'Apply 10% discount',
          changes: { discount_amount: 100, final_amount: 900 },
        },
        { id: 2, email: 'admin2@towchen.com', type: Role.Admin },
      );

      expect(prisma.consent_request.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entity_type: ConsentEntityType.Order,
            entity_id: 10,
            consent_type: ConsentType.OrderEdit,
            status: ConsentStatus.PendingApproval,
            current_step: ConsentStep.Approval,
            created_by_id: 2,
            created_by_role: Role.Admin,
          }),
        }),
      );

      expect(prisma.consent_audit_log.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: ConsentAction.Submit,
            step: ConsentStep.Approval,
          }),
        }),
      );

      expect(result).toEqual(createdConsent);
    });
  });

  describe('Step 2: approve (Role: Approver)', () => {
    it('should throw ForbiddenException if creator attempts self-approval', async () => {
      prisma.consent_request.findUnique.mockResolvedValue({
        id: 1,
        status: ConsentStatus.PendingApproval,
        current_step: ConsentStep.Approval,
        created_by_id: 5,
        created_by_role: Role.Admin,
      });

      await expect(
        service.approve(1, {}, { id: 5, email: 'same@towchen.com', type: Role.Admin }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should transition to PendingVerification and step Verification upon approval', async () => {
      prisma.consent_request.findUnique.mockResolvedValue({
        id: 1,
        status: ConsentStatus.PendingApproval,
        current_step: ConsentStep.Approval,
        created_by_id: 5,
        created_by_role: Role.Admin,
      });

      const updated = {
        id: 1,
        status: ConsentStatus.PendingVerification,
        current_step: ConsentStep.Verification,
      };
      prisma.consent_request.update.mockResolvedValue(updated);

      const result = await service.approve(
        1,
        { remarks: 'Approved' },
        { id: 9, email: 'approver@towchen.com', type: Role.Admin },
      );

      expect(prisma.consent_request.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: ConsentStatus.PendingVerification,
          current_step: ConsentStep.Verification,
        },
      });

      expect(result.status).toBe(ConsentStatus.PendingVerification);
    });
  });

  describe('Step 3: verify (Role: Verifier)', () => {
    it('should throw ForbiddenException if Approver who approved Step 2 attempts to verify Step 3', async () => {
      prisma.consent_request.findUnique.mockResolvedValue({
        id: 1,
        status: ConsentStatus.PendingVerification,
        current_step: ConsentStep.Verification,
        created_by_id: 5,
        created_by_role: Role.Admin,
      });

      // Mock finding step 2 approval by same admin
      prisma.consent_audit_log.findFirst.mockResolvedValue({
        id: 10,
        performed_by_id: 9,
      });

      await expect(
        service.verify(1, {}, { id: 9, email: 'approver@towchen.com', type: Role.Admin }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should transition to PendingFinalization and step Finalization upon verification by different verifier', async () => {
      prisma.consent_request.findUnique.mockResolvedValue({
        id: 1,
        status: ConsentStatus.PendingVerification,
        current_step: ConsentStep.Verification,
        created_by_id: 5,
        created_by_role: Role.Admin,
      });

      prisma.consent_audit_log.findFirst.mockResolvedValue(null);

      const updated = {
        id: 1,
        status: ConsentStatus.PendingFinalization,
        current_step: ConsentStep.Finalization,
      };
      prisma.consent_request.update.mockResolvedValue(updated);

      const result = await service.verify(
        1,
        { remarks: 'Verified details' },
        { id: 12, email: 'verifier@towchen.com', type: Role.Admin },
      );

      expect(result.status).toBe(ConsentStatus.PendingFinalization);
      expect(result.current_step).toBe(ConsentStep.Finalization);
    });
  });

  describe('Step 4: finalize (Role: Finalizer)', () => {
    it('should transition to PermissionGranted and dispatch execution hook', async () => {
      const consent = {
        id: 1,
        entity_type: ConsentEntityType.Order,
        entity_id: 10,
        consent_type: ConsentType.OrderEdit,
        status: ConsentStatus.PendingFinalization,
        current_step: ConsentStep.Finalization,
        created_by_id: 5,
        created_by_role: Role.Admin,
        proposed_payload: { final_amount: 900 },
      };
      prisma.consent_request.findUnique.mockResolvedValue(consent);
      prisma.consent_audit_log.findFirst.mockResolvedValue(null);

      const finalized = {
        ...consent,
        status: ConsentStatus.PermissionGranted,
      };
      prisma.consent_request.update.mockResolvedValue(finalized);

      const result = await service.finalize(
        1,
        { remarks: 'Final approval granted' },
        { id: 20, email: 'finalizer@towchen.com', type: Role.Admin },
      );

      expect(result.status).toBe(ConsentStatus.PermissionGranted);
      expect(dispatcher.dispatch).toHaveBeenCalledWith(finalized, expect.any(Object));
    });
  });

  describe('Rejections and Backtracking', () => {
    it('Step 2 rejection should terminate the consent process when caller has Approver role', async () => {
      prisma.consent_request.findUnique.mockResolvedValue({
        id: 1,
        status: ConsentStatus.PendingApproval,
        current_step: ConsentStep.Approval,
      });

      prisma.admin.findUnique.mockResolvedValue({
        id: 9,
        is_deleted: false,
        consent_roles: [ConsentRole.Approver],
      });

      prisma.consent_request.update.mockImplementation(({ data }) => ({
        id: 1,
        ...data,
      }));

      const result = await service.reject(
        1,
        { reason: 'Order edit request invalid' },
        { id: 9, email: 'approver@towchen.com', type: Role.Admin },
      );

      expect(result.status).toBe(ConsentStatus.Terminated);
      expect(result.current_step).toBe(ConsentStep.Approval);
    });

    it('Step 3 rejection should move back to Step 2 (PendingApproval) when caller has Verifier role', async () => {
      prisma.consent_request.findUnique.mockResolvedValue({
        id: 1,
        status: ConsentStatus.PendingVerification,
        current_step: ConsentStep.Verification,
      });

      prisma.admin.findUnique.mockResolvedValue({
        id: 12,
        is_deleted: false,
        consent_roles: [ConsentRole.Verifier],
      });

      prisma.consent_request.update.mockImplementation(({ data }) => ({
        id: 1,
        ...data,
      }));

      const result = await service.reject(
        1,
        { reason: 'Verifier spotted mismatch in calculations' },
        { id: 12, email: 'verifier@towchen.com', type: Role.Admin },
      );

      expect(result.status).toBe(ConsentStatus.PendingApproval);
      expect(result.current_step).toBe(ConsentStep.Approval);
    });

    it('Step 4 rejection should move back to Step 3 (PendingVerification) when caller has Finalizer role', async () => {
      prisma.consent_request.findUnique.mockResolvedValue({
        id: 1,
        status: ConsentStatus.PendingFinalization,
        current_step: ConsentStep.Finalization,
      });

      prisma.admin.findUnique.mockResolvedValue({
        id: 20,
        is_deleted: false,
        consent_roles: [ConsentRole.Finalizer],
      });

      prisma.consent_request.update.mockImplementation(({ data }) => ({
        id: 1,
        ...data,
      }));

      const result = await service.reject(
        1,
        { reason: 'Finalizer asks verifier to re-confirm tax numbers' },
        { id: 20, email: 'finalizer@towchen.com', type: Role.Admin },
      );

      expect(result.status).toBe(ConsentStatus.PendingVerification);
      expect(result.current_step).toBe(ConsentStep.Verification);
    });

    it('should throw ForbiddenException if caller does not hold the required role for rejection at that step', async () => {
      prisma.consent_request.findUnique.mockResolvedValue({
        id: 1,
        status: ConsentStatus.PendingVerification,
        current_step: ConsentStep.Verification,
      });

      // Caller only has Approver, but step is Verification
      prisma.admin.findUnique.mockResolvedValue({
        id: 99,
        is_deleted: false,
        consent_roles: [ConsentRole.Approver],
      });

      await expect(
        service.reject(
          1,
          { reason: 'Unauthorized rejection attempt' },
          { id: 99, email: 'approver@towchen.com', type: Role.Admin },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Query methods: findById and getAuditLogs', () => {
    it('findById should return consent record without audit logs', async () => {
      const mockConsent = { id: 1, status: ConsentStatus.PendingApproval };
      prisma.consent_request.findUnique.mockResolvedValue(mockConsent);

      const result = await service.findById(1);
      expect(result).toEqual(mockConsent);
      expect(prisma.consent_request.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('getAuditLogs should return all chronological logs for consent', async () => {
      prisma.consent_request.findUnique.mockResolvedValue({ id: 1 });
      const mockLogs = [
        { id: 1, consent_request_id: 1, action: ConsentAction.Submit },
        { id: 2, consent_request_id: 1, action: ConsentAction.Approve },
      ];
      prisma.consent_audit_log.findMany.mockResolvedValue(mockLogs);

      const result = await service.getAuditLogs(1);
      expect(result).toEqual(mockLogs);
      expect(prisma.consent_audit_log.findMany).toHaveBeenCalledWith({
        where: { consent_request_id: 1 },
        orderBy: { created_at: 'asc' },
      });
    });

    it('findGroupedByEntity should return structured groups for the entity with active status pointers', async () => {
      const mockOrderConsents = [
        {
          id: 1,
          entity_type: ConsentEntityType.Order,
          entity_id: 10,
          consent_type: ConsentType.OrderEdit,
          status: ConsentStatus.PendingVerification,
          current_step: ConsentStep.Verification,
          created_at: new Date(),
          audit_logs: [],
        },
        {
          id: 2,
          entity_type: ConsentEntityType.Order,
          entity_id: 10,
          consent_type: ConsentType.NewOrder,
          status: ConsentStatus.PermissionGranted,
          current_step: ConsentStep.Finalization,
          created_at: new Date(),
          audit_logs: [],
        },
      ];
      prisma.consent_request.findMany.mockResolvedValue(mockOrderConsents);

      const result = await service.findGroupedByEntity(ConsentEntityType.Order, 10);

      expect(result.entity_type).toBe(ConsentEntityType.Order);
      expect(result.entity_id).toBe(10);
      expect(result.total_consents).toBe(2);
      expect(result.groups).toHaveLength(2); // Only groups that actually have created records: OrderEdit, NewOrder

      const editGroup = result.groups.find((g) => g.consent_type === ConsentType.OrderEdit);
      expect(editGroup).toBeDefined();
      expect(editGroup?.has_active).toBe(true);
      expect(editGroup?.active_consent?.id).toBe(1);
      expect(editGroup?.total_count).toBe(1);

      const newOrderGroup = result.groups.find((g) => g.consent_type === ConsentType.NewOrder);
      expect(newOrderGroup).toBeDefined();
      expect(newOrderGroup?.has_active).toBe(false);
      expect(newOrderGroup?.total_count).toBe(1);

      // Uncreated consent types are not returned
      const closureGroup = result.groups.find((g) => g.consent_type === ConsentType.OrderClosure);
      expect(closureGroup).toBeUndefined();
    });

    it('findGrouped should work when only entity_id is provided or when neither is provided', async () => {
      const mockConsents = [
        {
          id: 5,
          entity_type: ConsentEntityType.Vendor,
          entity_id: 42,
          consent_type: ConsentType.VendorRegistration,
          status: ConsentStatus.PendingApproval,
          current_step: ConsentStep.Approval,
          created_at: new Date(),
          audit_logs: [],
        },
      ];
      prisma.consent_request.findMany.mockResolvedValue(mockConsents);

      // Only entity_id passed
      const resultById = await service.findGrouped(undefined, 42);
      expect(resultById.entity_type).toBeNull();
      expect(resultById.entity_id).toBe(42);
      expect(resultById.total_consents).toBe(1);
      expect(resultById.groups).toHaveLength(1);
      expect(resultById.groups[0].consent_type).toBe(ConsentType.VendorRegistration);

      // Neither passed
      const resultAll = await service.findGrouped();
      expect(resultAll.entity_type).toBeNull();
      expect(resultAll.entity_id).toBeNull();
      expect(resultAll.total_consents).toBe(1);
    });
  });
});
