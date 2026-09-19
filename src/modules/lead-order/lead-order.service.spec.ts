import { Test, TestingModule } from '@nestjs/testing';
import { LeadOrderService } from './lead-order.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StorageService } from 'src/services/storage/storage.service';
import { LeadStatus, OrderStatus, OrderOtpType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LeadOrderService', () => {
  let service: LeadOrderService;
  let prisma: any;
  let storage: any;

  beforeEach(async () => {
    prisma = {
      lead: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      lead_order_otp: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      lead_pickup_evcrf: {
        deleteMany: jest.fn(),
      },
      lead_dropoff_evcrf: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    storage = {
      uploadFileAsync: jest.fn().mockResolvedValue({ url: 'https://test.com/img.jpg' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadOrderService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get<LeadOrderService>(LeadOrderService);
  });

  describe('createLeadOrder', () => {
    it('should throw NotFoundException if lead does not exist', async () => {
      prisma.lead.findUnique.mockResolvedValue(null);
      await expect(service.createLeadOrder(10, 99)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if lead is not New', async () => {
      prisma.lead.findUnique.mockResolvedValue({ id: 99, status: LeadStatus.Booked });
      await expect(service.createLeadOrder(10, 99)).rejects.toThrow(BadRequestException);
    });

    it('should update lead with customer_id, order_status, and order_formated_id', async () => {
      const mockLead = {
        id: 42,
        status: LeadStatus.New,
        vendor_id: 1,
        driver_id: 2,
        vehicle_id: 3,
      };
      prisma.lead.findUnique.mockResolvedValue(mockLead);
      prisma.lead.update.mockResolvedValue({
        ...mockLead,
        status: LeadStatus.Booked,
        order_status: OrderStatus.Assigned,
        customer_id: 10,
        order_formated_id: 'LDO0000042',
      });

      const result = await service.createLeadOrder(10, 42);

      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: expect.objectContaining({
          status: LeadStatus.Booked,
          order_status: OrderStatus.Assigned,
          customer_id: 10,
          order_formated_id: 'LDO0000042',
        }),
        include: expect.any(Object),
      });
      expect(result.order_formated_id).toBe('LDO0000042');
      expect(result.order_status).toBe(OrderStatus.Assigned);
    });
  });

  describe('getLeadOrderById', () => {
    it('should return lead order when found', async () => {
      prisma.lead.findUnique.mockResolvedValue({ id: 1, formated_id: 'LED0000001' });
      const result = await service.getLeadOrderById(1);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException when lead is not found', async () => {
      prisma.lead.findUnique.mockResolvedValue(null);
      await expect(service.getLeadOrderById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLeadOrdersForDriver', () => {
    it('should query leads with driver_id and order_status filter', async () => {
      prisma.lead.findMany.mockResolvedValue([{ id: 1 }]);
      const result = await service.getLeadOrdersForDriver(5);

      expect(prisma.lead.findMany).toHaveBeenCalledWith({
        where: {
          driver_id: 5,
          customer_id: { not: null },
          order_status: {
            notIn: [OrderStatus.Completed, OrderStatus.Closed],
          },
        },
        include: expect.any(Object),
        orderBy: { created_at: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('sendOrderOtpAsync', () => {
    it('should generate OTP and update lead order_status to OtpPending', async () => {
      prisma.lead.findUnique.mockResolvedValue({ id: 1, driver_id: 5 });
      prisma.lead_order_otp.upsert.mockResolvedValue({});
      prisma.lead.update.mockResolvedValue({});

      const result = await service.sendOrderOtpAsync(1, OrderOtpType.BREAKDOWN, 5);

      expect(result.message).toBe('OTP generated successfully');
      expect(prisma.lead_order_otp.upsert).toHaveBeenCalled();
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { order_status: OrderStatus.OtpPending },
      });
    });

    it('should reject if driver does not match', async () => {
      prisma.lead.findUnique.mockResolvedValue({ id: 1, driver_id: 10 });
      await expect(
        service.sendOrderOtpAsync(1, OrderOtpType.BREAKDOWN, 5),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOrderOtpAsync', () => {
    it('should verify OTP and update order_status', async () => {
      prisma.lead.findUnique.mockResolvedValue({ id: 1, driver_id: 5 });
      prisma.lead_order_otp.findUnique.mockResolvedValue({
        id: 100,
        otp: '123456',
        is_verified: false,
        expires_at: new Date(Date.now() + 1000000),
      });

      const result = await service.verifyOrderOtpAsync(1, OrderOtpType.BREAKDOWN, '123456', 5);

      expect(result.message).toBe('OTP verified successfully.');
      expect(prisma.lead_order_otp.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: expect.objectContaining({ is_verified: true }),
      });
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ order_status: OrderStatus.InProgress }),
      });
    });
  });
});
