import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderStatus,
  DisputeStatus,
  ConsentType,
  ConsentEntityType,
  ConsentStatus,
  ConsentStep,
} from '@prisma/client';
import { OrderClosureSchedulerService } from './order-closure-scheduler.service';
import { PrismaService } from 'src/core/prisma/prisma.service';

describe('OrderClosureSchedulerService', () => {
  let service: OrderClosureSchedulerService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: jest.fn(),
      },
      admin: {
        findFirst: jest.fn().mockResolvedValue({ id: 1, role: 'Admin' }),
      },
      consent_request: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      consent_audit_log: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderClosureSchedulerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OrderClosureSchedulerService>(OrderClosureSchedulerService);
  });

  it('should return 0 when no completed orders exist', async () => {
    prisma.order.findMany.mockResolvedValue([]);
    const count = await service.processCompletedOrdersForClosure();
    expect(count).toBe(0);
  });

  it('should skip order if an OrderClosure consent already exists', async () => {
    const completedAt = new Date(Date.now() - 30 * 60 * 60 * 1000); // 30 hours ago
    prisma.order.findMany.mockResolvedValue([
      {
        id: 1,
        formated_id: 'ORD0000001',
        status: OrderStatus.Completed,
        completion_time: completedAt,
        disputes: [],
      },
    ]);

    prisma.consent_request.findFirst.mockResolvedValue({
      id: 99,
      status: ConsentStatus.PendingApproval,
    });

    const count = await service.processCompletedOrdersForClosure();
    expect(count).toBe(0);
    expect(prisma.consent_request.create).not.toHaveBeenCalled();
  });

  it('should skip order if an active dispute is pending review (CMS blocked)', async () => {
    const completedAt = new Date(Date.now() - 30 * 60 * 60 * 1000); // 30 hours ago
    prisma.order.findMany.mockResolvedValue([
      {
        id: 1,
        formated_id: 'ORD0000001',
        status: OrderStatus.Completed,
        completion_time: completedAt,
        disputes: [
          {
            id: 10,
            status: DisputeStatus.PendingVerification, // Active dispute!
            demanded_amount: 500,
            approved_amount: 500,
            finalized_at: null,
            terminated_at: null,
            updated_at: new Date(),
          },
        ],
      },
    ]);

    prisma.consent_request.findFirst.mockResolvedValue(null);

    const count = await service.processCompletedOrdersForClosure();
    expect(count).toBe(0);
    expect(prisma.consent_request.create).not.toHaveBeenCalled();
  });

  it('should skip order if 24 hours have NOT elapsed since order completion (no disputes)', async () => {
    const completedAt = new Date(Date.now() - 10 * 60 * 60 * 1000); // Only 10 hours ago (< 24h)
    prisma.order.findMany.mockResolvedValue([
      {
        id: 1,
        formated_id: 'ORD0000001',
        status: OrderStatus.Completed,
        completion_time: completedAt,
        disputes: [],
      },
    ]);

    prisma.consent_request.findFirst.mockResolvedValue(null);

    const count = await service.processCompletedOrdersForClosure();
    expect(count).toBe(0);
    expect(prisma.consent_request.create).not.toHaveBeenCalled();
  });

  it('should skip order if 24 hours have NOT elapsed since dispute resolution (timer reset)', async () => {
    const completedAt = new Date(Date.now() - 48 * 60 * 60 * 1000); // Order completed 48h ago
    const resolvedAt = new Date(Date.now() - 5 * 60 * 60 * 1000); // Dispute resolved only 5h ago (< 24h)

    prisma.order.findMany.mockResolvedValue([
      {
        id: 1,
        formated_id: 'ORD0000001',
        status: OrderStatus.Completed,
        completion_time: completedAt,
        disputes: [
          {
            id: 10,
            status: DisputeStatus.PermissionGranted,
            demanded_amount: 500,
            approved_amount: 350,
            finalized_at: resolvedAt,
            terminated_at: null,
            updated_at: resolvedAt,
          },
        ],
      },
    ]);

    prisma.consent_request.findFirst.mockResolvedValue(null);

    const count = await service.processCompletedOrdersForClosure();
    expect(count).toBe(0);
    expect(prisma.consent_request.create).not.toHaveBeenCalled();
  });

  it('should auto-create OrderClosure consent when 24h elapsed since completion (no disputes)', async () => {
    const completedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago (> 24h)
    prisma.order.findMany.mockResolvedValue([
      {
        id: 1,
        formated_id: 'ORD0000001',
        status: OrderStatus.Completed,
        completion_time: completedAt,
        disputes: [],
      },
    ]);

    prisma.consent_request.findFirst.mockResolvedValue(null);
    prisma.consent_request.create.mockResolvedValue({
      id: 501,
      consent_type: ConsentType.OrderClosure,
      entity_type: ConsentEntityType.Order,
      entity_id: 1,
      status: ConsentStatus.PendingApproval,
      current_step: ConsentStep.Approval,
    });

    const count = await service.processCompletedOrdersForClosure();
    expect(count).toBe(1);
    expect(prisma.consent_request.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          consent_type: ConsentType.OrderClosure,
          entity_type: ConsentEntityType.Order,
          entity_id: 1,
          title: 'Order Closure: ORD0000001',
        }),
      }),
    );
    expect(prisma.consent_audit_log.create).toHaveBeenCalled();
  });

  it('should auto-create OrderClosure consent when 24h elapsed since dispute resolution', async () => {
    const completedAt = new Date(Date.now() - 60 * 60 * 60 * 1000); // 60h ago
    const resolvedAt = new Date(Date.now() - 26 * 60 * 60 * 1000); // 26h ago (> 24h)

    prisma.order.findMany.mockResolvedValue([
      {
        id: 2,
        formated_id: 'ORD0000002',
        status: OrderStatus.Completed,
        completion_time: completedAt,
        disputes: [
          {
            id: 15,
            status: DisputeStatus.PermissionGranted,
            demanded_amount: 600,
            approved_amount: 400,
            finalized_at: resolvedAt,
            terminated_at: null,
            updated_at: resolvedAt,
          },
        ],
      },
    ]);

    prisma.consent_request.findFirst.mockResolvedValue(null);
    prisma.consent_request.create.mockResolvedValue({
      id: 502,
      consent_type: ConsentType.OrderClosure,
      entity_id: 2,
    });

    const count = await service.processCompletedOrdersForClosure();
    expect(count).toBe(1);
    expect(prisma.consent_request.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entity_id: 2,
          proposed_payload: expect.objectContaining({
            total_approved_dispute_amount: 400,
            dispute_count: 1,
          }),
        }),
      }),
    );
  });
});
