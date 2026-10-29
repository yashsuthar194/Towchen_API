import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  AdminPackageOrderService,
  hasCabService,
  hasHotelService,
} from './admin-package-order.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { StorageService } from 'src/services/storage/storage.service';
import {
  ClientType,
  DispatchType,
  FuelType,
  OrderStatus,
  OrderType,
  VehicleCurrentStatus,
} from '@prisma/client';

describe('AdminPackageOrderService - Unit Tests', () => {
  let service: AdminPackageOrderService;
  let prisma: any;

  const mockPrisma = {
    dealer_package_order: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    sub_service: {
      findUnique: jest.fn(),
    },
    admin_package_order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockStorageService = {
    uploadFileAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPackageOrderService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<AdminPackageOrderService>(AdminPackageOrderService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('Extra Services Helpers', () => {
    it('should detect Cab correctly', () => {
      expect(hasCabService(['Cab'])).toBe(true);
      expect(hasCabService(['cab'])).toBe(true);
      expect(hasCabService([' CAB '])).toBe(true);
      expect(hasCabService(['Hotel Accomodation'])).toBe(false);
      expect(hasCabService([])).toBe(false);
      expect(hasCabService(undefined)).toBe(false);
    });

    it('should detect Hotel Accommodation correctly', () => {
      expect(hasHotelService(['Hotel Accomodation'])).toBe(true);
      expect(hasHotelService(['Hotel Accommodation'])).toBe(true);
      expect(hasHotelService(['hotel'])).toBe(true);
      expect(hasHotelService(['HOTEL ACCOMODATION'])).toBe(true);
      expect(hasHotelService(['Cab'])).toBe(false);
      expect(hasHotelService([])).toBe(false);
      expect(hasHotelService(undefined)).toBe(false);
    });
  });

  describe('createOrderAsync with Extra Services', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const basePackage = {
      id: 10,
      order_number: 'ORD-PKG-1001',
      formated_id: 'MBR0000001',
      status: 'Active',
      expiry_date: futureDate,
      incidents_allowed: 5,
      incidents_used: 1,
      cab_service_allowed: 3,
      cab_service_used: 0,
      hotel_accommodation_allowed: 2,
      hotel_accommodation_used: 0,
      dealer: { id: 1, name: 'Tata Motors', is_deleted: false },
    };

    const baseDto = {
      order_type: OrderType.Package,
      sub_service_id: 1,
      dispatch_type: DispatchType.Current,
      client_type: ClientType.Dealer,
      dealer_id: 1,
      dealer_package_order_id: 10,
      dealer_customer_id: 5,
      customer_name: 'Jainish Panchal',
      customer_number: '+919016616324',
      vehicle_make: 'Tata',
      vehicle_model: 'Altroz',
      vehicle_fuel_type: FuelType.Diesel,
      vehicle_reg_number: 'GJ01HA9667',
      vehicle_chassis_number: 'MB28431SDSD45153',
      vehicle_current_status: VehicleCurrentStatus.AtHouse,
      extra_services: ['Cab', 'Hotel Accomodation'],
    };

    it('should throw BadRequestException if Cab incidents are exhausted', async () => {
      mockPrisma.dealer_package_order.findUnique.mockResolvedValue({
        ...basePackage,
        cab_service_allowed: 3,
        cab_service_used: 3, // exhausted!
      });

      await expect(service.createOrderAsync(baseDto, [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if Hotel incidents are exhausted', async () => {
      mockPrisma.dealer_package_order.findUnique.mockResolvedValue({
        ...basePackage,
        hotel_accommodation_allowed: 2,
        hotel_accommodation_used: 2, // exhausted!
      });

      await expect(service.createOrderAsync(baseDto, [])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should atomically reserve service, cab, and hotel incidents when valid', async () => {
      mockPrisma.dealer_package_order.findUnique.mockResolvedValue(basePackage);
      mockPrisma.sub_service.findUnique.mockResolvedValue({
        id: 1,
        journey_type: 'ThreeWay',
      });
      mockPrisma.dealer_package_order.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.admin_package_order.findFirst.mockResolvedValue(null);
      mockPrisma.admin_package_order.findUnique.mockResolvedValue(null);
      mockPrisma.admin_package_order.create.mockResolvedValue({
        id: 1,
        formated_id: 'APO0000001',
        status: OrderStatus.New,
        extra_services: ['Cab', 'Hotel Accomodation'],
      });

      const result = await service.createOrderAsync(baseDto, []);

      expect(mockPrisma.dealer_package_order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 10,
          incidents_used: { lt: 5 },
          cab_service_used: { lt: 3 },
          hotel_accommodation_used: { lt: 2 },
        },
        data: {
          incidents_used: { increment: 1 },
          cab_service_used: { increment: 1 },
          hotel_accommodation_used: { increment: 1 },
        },
      });

      expect(result.id).toBe(1);
      expect(result.extra_services).toEqual(['Cab', 'Hotel Accomodation']);
    });
  });

  describe('cancelOrderAsync with Extra Services', () => {
    it('should refund service, cab, and hotel incidents when order with extra services is cancelled', async () => {
      const order = {
        id: 1,
        formated_id: 'APO0000001',
        status: OrderStatus.New,
        dealer_package_order_id: 10,
        extra_services: ['Cab', 'Hotel Accomodation'],
        dealer_package_order: {
          id: 10,
          incidents_used: 2,
          cab_service_used: 1,
          hotel_accommodation_used: 1,
        },
      };

      mockPrisma.admin_package_order.findUnique.mockResolvedValue(order);
      mockPrisma.admin_package_order.update.mockResolvedValue({
        ...order,
        status: OrderStatus.Cancelled,
        cancel_reason: 'Customer cancelled',
      });
      mockPrisma.dealer_package_order.update.mockResolvedValue({});

      await service.cancelOrderAsync(1, 'Customer cancelled');

      expect(mockPrisma.dealer_package_order.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          incidents_used: { decrement: 1 },
          cab_service_used: { decrement: 1 },
          hotel_accommodation_used: { decrement: 1 },
        },
      });
    });
  });
});
