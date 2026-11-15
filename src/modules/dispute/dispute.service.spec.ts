import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  DisputeType,
  DisputeStatus,
  DisputeStep,
  DisputeAction,
  DisputeRole,
  OrderStatus,
  Role,
} from '@prisma/client';
import { DisputeService } from './dispute.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { StorageService } from 'src/services/storage/storage.service';
import { JwtPayload } from 'src/services/jwt/interfaces/jwt-payload.interface';

describe('DisputeService', () => {
  let service: DisputeService;
  let prisma: any;
  let storageService: any;

  const vendorCaller: JwtPayload = {
    id: 10,
    type: Role.Vendor,
    email: 'vendor@towchen.com',
  };

  const resolverAdmin: JwtPayload = {
    id: 201,
    type: Role.Admin,
    email: 'resolver@towchen.com',
  };

  const verifierAdmin: JwtPayload = {
    id: 202,
    type: Role.Admin,
    email: 'verifier@towchen.com',
  };

  const finalizerAdmin: JwtPayload = {
    id: 203,
    type: Role.Admin,
    email: 'finalizer@towchen.com',
  };

  const superAdminCaller: JwtPayload = {
    id: 1,
    type: Role.SuperAdmin,
    email: 'superadmin@towchen.com',
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
      },
      admin: {
        findUnique: jest.fn(),
      },
      consent_request: {
        findFirst: jest.fn(),
      },
      dispute_request: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      dispute_audit_log: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    storageService = {
      uploadFileAsync: jest.fn().mockResolvedValue({
        url: 'https://s3.amazonaws.com/towchen-bucket/disputes/toll_proof.jpg',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputeService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<DisputeService>(DisputeService);
  });

  describe('createDispute', () => {
    const validDto = {
      order_id: 100,
      dispute_type: DisputeType.TollDispute,
      demanded_amount: 500.0,
      description: 'Expressway toll charge',
      proof_urls: ['https://s3.amazonaws.com/receipt.jpg'],
    };

    it('should throw ForbiddenException if caller is not a Vendor or Admin', async () => {
      const driverCaller: JwtPayload = { id: 5, type: Role.Driver, email: 'd@t.com' };
      await expect(service.createDispute(validDto, driverCaller)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.createDispute(validDto, vendorCaller)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if vendor does not own the order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 100,
        formated_id: 'ORD0000100',
        vendor_id: 999, // Different vendor
        status: OrderStatus.Completed,
      });

      await expect(service.createDispute(validDto, vendorCaller)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if order is not Completed', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 100,
        formated_id: 'ORD0000100',
        vendor_id: 10,
        status: OrderStatus.InProgress,
      });

      await expect(service.createDispute(validDto, vendorCaller)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if CMS OrderClosure consent already initiated', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 100,
        formated_id: 'ORD0000100',
        vendor_id: 10,
        status: OrderStatus.Completed,
      });

      prisma.consent_request.findFirst.mockResolvedValue({
        id: 77,
        status: 'PendingApproval',
      });

      await expect(service.createDispute(validDto, vendorCaller)).rejects.toThrow(
        /Dispute window for Order #100 .* is closed/,
      );
    });

    it('should throw BadRequestException if an active dispute of the same type is already pending', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 100,
        formated_id: 'ORD0000100',
        vendor_id: 10,
        status: OrderStatus.Completed,
      });
      prisma.consent_request.findFirst.mockResolvedValue(null);

      prisma.dispute_request.findFirst.mockResolvedValue({
        id: 1,
        formated_id: 'DSP0000001',
        status: DisputeStatus.PendingResolution,
        current_step: DisputeStep.Resolution,
      });

      await expect(service.createDispute(validDto, vendorCaller)).rejects.toThrow(
        /already PendingResolution at step Resolution/,
      );
    });

    it('should successfully create dispute with DSP formatted ID and audit log', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 100,
        formated_id: 'ORD0000100',
        vendor_id: 10,
        status: OrderStatus.Completed,
        completion_time: new Date(),
      });
      prisma.consent_request.findFirst.mockResolvedValue(null);
      prisma.dispute_request.findFirst.mockResolvedValue(null);

      prisma.dispute_request.create.mockResolvedValue({
        id: 42,
        formated_id: 'DSP0000042',
        order_id: 100,
        vendor_id: 10,
        dispute_type: DisputeType.TollDispute,
        demanded_amount: 500.0,
        approved_amount: 500.0,
        status: DisputeStatus.PendingResolution,
        current_step: DisputeStep.Resolution,
      });

      const result = await service.createDispute(validDto, vendorCaller);

      expect(result.id).toBe(42);
      expect(result.formated_id).toBe('DSP0000042');
      expect(prisma.dispute_audit_log.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dispute_request_id: 42,
            step: DisputeStep.Resolution,
            action: DisputeAction.Submit,
            demanded_amount: 500.0,
          }),
        }),
      );
    });
  });

  describe('Step 2: resolve', () => {
    it('should advance dispute from PendingResolution to PendingVerification', async () => {
      prisma.admin.findUnique.mockResolvedValue({
        id: 201,
        is_deleted: false,
        dispute_roles: [DisputeRole.Resolver],
      });

      prisma.dispute_request.findUnique.mockResolvedValue({
        id: 1,
        formated_id: 'DSP0000001',
        status: DisputeStatus.PendingResolution,
        current_step: DisputeStep.Resolution,
        demanded_amount: 500.0,
        approved_amount: 500.0,
      });

      prisma.dispute_request.update.mockResolvedValue({
        id: 1,
        status: DisputeStatus.PendingVerification,
        current_step: DisputeStep.Verification,
      });

      const result = await service.resolve(1, { remarks: 'Valid toll receipt' }, resolverAdmin);
      expect(result.status).toBe(DisputeStatus.PendingVerification);
      expect(prisma.dispute_audit_log.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: DisputeAction.Resolve,
            step: DisputeStep.Resolution,
            previous_status: DisputeStatus.PendingResolution,
            new_status: DisputeStatus.PendingVerification,
          }),
        }),
      );
    });
  });

  describe('Step 3: verify (with price adjustment)', () => {
    it('should allow admin to edit approved_amount and advance to PendingFinalization', async () => {
      prisma.admin.findUnique.mockResolvedValue({
        id: 202,
        is_deleted: false,
        dispute_roles: [DisputeRole.Verifier],
      });

      prisma.dispute_request.findUnique.mockResolvedValue({
        id: 1,
        formated_id: 'DSP0000001',
        status: DisputeStatus.PendingVerification,
        current_step: DisputeStep.Verification,
        demanded_amount: 500.0,
        approved_amount: 500.0,
      });

      // No prior resolution by verifier 202
      prisma.dispute_audit_log.findFirst.mockResolvedValue(null);

      prisma.dispute_request.update.mockResolvedValue({
        id: 1,
        status: DisputeStatus.PendingFinalization,
        current_step: DisputeStep.Finalization,
        approved_amount: 350.0,
      });

      const result = await service.verify(
        1,
        { approved_amount: 350.0, remarks: 'Verified toll receipt shows 350' },
        verifierAdmin,
      );

      expect(result.approved_amount).toBe(350.0);
      expect(prisma.dispute_audit_log.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: DisputeAction.Verify,
            step: DisputeStep.Verification,
            previous_status: DisputeStatus.PendingVerification,
            new_status: DisputeStatus.PendingFinalization,
            approved_amount: 350.0,
          }),
        }),
      );
    });

    it('should enforce separation of duties if Step 2 Resolver tries to verify Step 3', async () => {
      prisma.admin.findUnique.mockResolvedValue({
        id: 201,
        is_deleted: false,
        dispute_roles: [DisputeRole.Resolver, DisputeRole.Verifier],
      });

      prisma.dispute_request.findUnique.mockResolvedValue({
        id: 1,
        status: DisputeStatus.PendingVerification,
        current_step: DisputeStep.Verification,
      });

      // Admin 201 already resolved Step 2
      prisma.dispute_audit_log.findFirst.mockResolvedValue({
        id: 10,
        performed_by_id: 201,
        step: DisputeStep.Resolution,
        action: DisputeAction.Resolve,
      });

      await expect(
        service.verify(1, { approved_amount: 350.0 }, resolverAdmin),
      ).rejects.toThrow(/Separation of duties violation/);
    });
  });

  describe('Step 4: finalize', () => {
    it('should advance dispute to PermissionGranted and set finalized_at', async () => {
      prisma.admin.findUnique.mockResolvedValue({
        id: 203,
        is_deleted: false,
        dispute_roles: [DisputeRole.Finalizer],
      });

      prisma.dispute_request.findUnique.mockResolvedValue({
        id: 1,
        formated_id: 'DSP0000001',
        order_id: 100,
        status: DisputeStatus.PendingFinalization,
        current_step: DisputeStep.Finalization,
        demanded_amount: 500.0,
        approved_amount: 350.0,
      });

      // No prior verification by finalizer 203
      prisma.dispute_audit_log.findFirst.mockResolvedValue(null);

      prisma.dispute_request.update.mockResolvedValue({
        id: 1,
        status: DisputeStatus.PermissionGranted,
        finalized_at: new Date(),
      });

      const result = await service.finalize(1, { remarks: 'Settlement confirmed' }, finalizerAdmin);
      expect(result.status).toBe(DisputeStatus.PermissionGranted);
      expect(prisma.dispute_audit_log.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: DisputeAction.Finalize,
            step: DisputeStep.Finalization,
            previous_status: DisputeStatus.PendingFinalization,
            new_status: DisputeStatus.PermissionGranted,
          }),
        }),
      );
    });

    it('should enforce separation of duties if Step 3 Verifier tries to finalize Step 4', async () => {
      prisma.admin.findUnique.mockResolvedValue({
        id: 202,
        is_deleted: false,
        dispute_roles: [DisputeRole.Verifier, DisputeRole.Finalizer],
      });

      prisma.dispute_request.findUnique.mockResolvedValue({
        id: 1,
        status: DisputeStatus.PendingFinalization,
        current_step: DisputeStep.Finalization,
      });

      // Admin 202 verified Step 3
      prisma.dispute_audit_log.findFirst.mockResolvedValue({
        id: 15,
        performed_by_id: 202,
        step: DisputeStep.Verification,
        action: DisputeAction.Verify,
      });

      await expect(
        service.finalize(1, { remarks: 'Attempt finalization' }, verifierAdmin),
      ).rejects.toThrow(/Separation of duties violation/);
    });
  });

  describe('reject', () => {
    it('should terminate dispute and record reason', async () => {
      prisma.admin.findUnique.mockResolvedValue({
        id: 201,
        is_deleted: false,
        dispute_roles: [DisputeRole.Resolver],
      });

      prisma.dispute_request.findUnique.mockResolvedValue({
        id: 1,
        formated_id: 'DSP0000001',
        status: DisputeStatus.PendingResolution,
        current_step: DisputeStep.Resolution,
      });

      prisma.dispute_request.update.mockResolvedValue({
        id: 1,
        status: DisputeStatus.Terminated,
        terminated_at: new Date(),
      });

      const result = await service.reject(
        1,
        { remarks: 'Fake receipt uploaded' },
        resolverAdmin,
      );

      expect(result.status).toBe(DisputeStatus.Terminated);
      expect(prisma.dispute_audit_log.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: DisputeAction.Reject,
            new_status: DisputeStatus.Terminated,
            remarks: 'Fake receipt uploaded',
          }),
        }),
      );
    });
  });
});
