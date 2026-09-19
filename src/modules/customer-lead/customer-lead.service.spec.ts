import { Test, TestingModule } from '@nestjs/testing';
import { CustomerLeadService } from './customer-lead.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { OrderGateway } from '../order/order.gateway';
import { LeadOrderService } from '../lead-order/lead-order.service';
import { LeadStatus } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CustomerLeadService', () => {
  let service: CustomerLeadService;
  let prisma: any;
  let gateway: any;
  let leadOrderService: any;

  beforeEach(async () => {
    prisma = {
      lead: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    gateway = {
      emitNewLeadToDriver: jest.fn(),
    };

    leadOrderService = {
      createLeadOrder: jest.fn(),
      getLeadOrdersForCustomer: jest.fn(),
      getLeadOrderById: jest.fn(),
      getLeadOrderOtpsForCustomerAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerLeadService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrderGateway, useValue: gateway },
        { provide: LeadOrderService, useValue: leadOrderService },
      ],
    }).compile();

    service = module.get<CustomerLeadService>(CustomerLeadService);
  });

  describe('getAvailableLeads', () => {
    it('should query leads with New status', async () => {
      prisma.lead.findMany.mockResolvedValue([{ id: 1, status: LeadStatus.New }]);
      const result = await service.getAvailableLeads({} as any);

      expect(prisma.lead.findMany).toHaveBeenCalledWith({
        where: { status: LeadStatus.New },
        include: expect.any(Object),
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('bookLead', () => {
    it('should throw NotFoundException if lead does not exist', async () => {
      prisma.lead.findUnique.mockResolvedValue(null);
      await expect(service.bookLead(1, 99)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if lead is already booked', async () => {
      prisma.lead.findUnique.mockResolvedValue({ id: 99, status: LeadStatus.Booked });
      await expect(service.bookLead(1, 99)).rejects.toThrow(BadRequestException);
    });

    it('should book lead and emit new-lead socket event to driver', async () => {
      const mockLead = {
        id: 5,
        formated_id: 'LED0000005',
        status: LeadStatus.New,
        driver_id: 12,
        start_location_data: { lat: 10, lng: 20 },
        end_location_data: { lat: 30, lng: 40 },
        sub_service: {
          name: 'Towing',
          service: { name: 'Emergency' },
        },
      };

      const mockBookedLead = {
        id: 5,
        formated_id: 'LED0000005',
        order_formated_id: 'LDO0000005',
        status: LeadStatus.Booked,
      };

      prisma.lead.findUnique.mockResolvedValue(mockLead);
      leadOrderService.createLeadOrder.mockResolvedValue(mockBookedLead);

      const result = await service.bookLead(1, 5);

      expect(leadOrderService.createLeadOrder).toHaveBeenCalledWith(1, 5);
      expect(gateway.emitNewLeadToDriver).toHaveBeenCalledWith(12, {
        lead_id: 5,
        lead_formatted_id: 'LED0000005',
        lead_order_formatted_id: 'LDO0000005',
        lead_order_id: 5,
        start_location: mockLead.start_location_data,
        end_location: mockLead.end_location_data,
        service_name: 'Emergency',
        sub_service_name: 'Towing',
      });
      expect(result).toEqual(mockBookedLead);
    });
  });
});
