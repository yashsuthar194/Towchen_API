import { Test, TestingModule } from '@nestjs/testing';
import { DealerPackageOrderService } from './dealer-package-order.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { PackagePdfService } from './services/package-pdf.service';
import { StorageService } from 'src/services/storage/storage.service';

describe('DealerPackageOrderService - Contracts & Prefill Tests', () => {
  let service: DealerPackageOrderService;

  const mockPrisma = {
    dealer_package_order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockPdf = { generateCertificatePdfAsync: jest.fn() };
  const mockStorage = { uploadFileAsync: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealerPackageOrderService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PackagePdfService, useValue: mockPdf },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<DealerPackageOrderService>(DealerPackageOrderService);
    jest.clearAllMocks();
  });

  describe('findContractsByDealerAsync', () => {
    it('should return active customer contracts with service, cab, and hotel incidents', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockPrisma.dealer_package_order.findMany.mockResolvedValue([
        {
          id: 10,
          formated_id: 'MBR0000001',
          order_number: 'ORD-PKG-1001',
          plan_name: 'Gold RSA Plan',
          status: 'Active',
          expiry_date: futureDate,
          incidents_allowed: 5,
          incidents_used: 2,
          cab_service_allowed: 3,
          cab_service_used: 1,
          hotel_accommodation_allowed: 2,
          hotel_accommodation_used: 0,
          customer: {
            id: 5,
            customer_name: 'Jainish Panchal',
            customer_number: '+919016616324',
          },
          vehicle: {
            id: 8,
            vehicle_reg_number: 'GJ01HA9667',
            vehicle_make: 'Tata',
            vehicle_model: 'Altroz',
          },
        },
      ]);

      const contracts = await service.findContractsByDealerAsync(1);

      expect(contracts).toHaveLength(1);
      const c = contracts[0];
      expect(c.id).toBe(10);
      expect(c.formated_id).toBe('MBR0000001');
      expect(c.order_number).toBe('ORD-PKG-1001');
      expect(c.plan_name).toBe('Gold RSA Plan');
      expect(c.customer_name).toBe('Jainish Panchal');
      expect(c.customer_number).toBe('+919016616324');
      expect(c.vehicle_reg_number).toBe('GJ01HA9667');
      expect(c.available_service_incidents).toBe(3);
      expect(c.available_cab_incidents).toBe(2);
      expect(c.available_hotel_incidents).toBe(2);
      expect(c.can_create_order).toBe(true);
    });
  });

  describe('getPrefillDetailsAsync', () => {
    it('should return complete prefill data including cab and hotel counts', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockPrisma.dealer_package_order.findUnique.mockResolvedValue({
        id: 10,
        formated_id: 'MBR0000001',
        order_number: 'ORD-PKG-1001',
        plan_name: 'Gold RSA Plan',
        car_segment: 'Hatchback',
        status: 'Active',
        expiry_date: futureDate,
        start_date: new Date(),
        incidents_allowed: 5,
        incidents_used: 2,
        cab_service_allowed: 3,
        cab_service_used: 0,
        hotel_accommodation_allowed: 3,
        hotel_accommodation_used: 0,
        dealer: {
          id: 1,
          name: 'Tata Motors Dealership',
          formated_id: 'DLR0000001',
          number: '+919876543210',
          email: 'dealer@tatamotors.com',
        },
        customer: {
          id: 5,
          customer_name: 'Jainish Panchal',
          customer_number: '+919016616324',
          alternative_number: '+919825000000',
        },
        vehicle: {
          id: 8,
          vehicle_make: 'Tata',
          vehicle_model: 'Altroz',
          variant: 'Dark Smart AT',
          vehicle_fuel_type: 'Diesel',
          body_type: 'Hatchback',
          vehicle_reg_number: 'GJ01HA9667',
          chassis_number: 'MB28431SDSD45153',
        },
      });

      const details = await service.getPrefillDetailsAsync(10);

      expect(details.dealer.id).toBe(1);
      expect(details.package.id).toBe(10);
      expect(details.package.available_service_incidents).toBe(3);
      expect(details.package.available_cab_incidents).toBe(3);
      expect(details.package.available_hotel_incidents).toBe(3);
      expect(details.package.can_create_order).toBe(true);

      // Customer fields
      expect(details.customer.id).toBe(5);
      expect(details.customer.name).toBe('Jainish Panchal');
      expect(details.customer.number).toBe('+919016616324');
      expect(details.customer.alternate_number).toBe('+919825000000');

      // Vehicle fields
      expect(details.vehicle.id).toBe(8);
      expect(details.vehicle.make).toBe('Tata');
      expect(details.vehicle.model).toBe('Altroz');
      expect(details.vehicle.variant).toBe('Dark Smart AT');
      expect(details.vehicle.fuel_type).toBe('Diesel');
      expect(details.vehicle.reg_number).toBe('GJ01HA9667');
      expect(details.vehicle.chassis_number).toBe('MB28431SDSD45153');

      // Top level convenience counts matching UI
      expect(details.available_service_incidents).toBe(3);
      expect(details.available_cab_incidents).toBe(3);
      expect(details.available_hotel_incidents).toBe(3);
    });

    it('should return can_create_order: false with reason when service incidents are exhausted (without throwing 400)', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      mockPrisma.dealer_package_order.findUnique.mockResolvedValue({
        id: 10,
        formated_id: 'MBR0000001',
        order_number: 'ORD-PKG-1001',
        plan_name: 'Gold RSA Plan',
        status: 'Active',
        expiry_date: futureDate,
        incidents_allowed: 5,
        incidents_used: 5, // All used!
        cab_service_allowed: 3,
        cab_service_used: 0,
        hotel_accommodation_allowed: 3,
        hotel_accommodation_used: 0,
        dealer: { id: 1, name: 'Tata' },
        customer: { id: 5, customer_name: 'Jainish' },
        vehicle: { id: 8, vehicle_reg_number: 'GJ01HA9667' },
      });

      const details = await service.getPrefillDetailsAsync(10);

      expect(details.package.can_create_order).toBe(false);
      expect(details.package.cannot_create_reason).toContain('All 5 package service incidents have already been used');
      expect(details.package.available_service_incidents).toBe(0);
    });
  });
});
