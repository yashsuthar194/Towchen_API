import { Test, TestingModule } from '@nestjs/testing';
import { CashfreeController } from './cashfree.controller';
import { CashfreeService } from './cashfree.service';
import { CallerService } from 'src/services/jwt/caller.service';

describe('CashfreeController', () => {
  let controller: CashfreeController;
  let cashfreeService: CashfreeService;

  const mockResponse = {
    verification_id: 'test001',
    reference_id: 1234,
    status: 'VALID',
    reg_no: 'PY01MW8769',
    class: 'Motor Car',
    owner_name: 'JOHN DOE',
  };

  const mockUsage = {
    limit: 25,
    used: 5,
    remaining: 20,
    reset_at: '2026-11-17T00:00:00.000Z',
    is_blocked: false,
    dealer_id: 1,
  };

  const mockCashfreeService = {
    getVehicleRcDetails: jest.fn().mockResolvedValue(mockResponse),
    getRcUsage: jest.fn().mockResolvedValue(mockUsage),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashfreeController],
      providers: [
        {
          provide: CashfreeService,
          useValue: mockCashfreeService,
        },
      ],
    }).compile();

    controller = module.get<CashfreeController>(CashfreeController);
    cashfreeService = module.get<CashfreeService>(CashfreeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get vehicle RC details via POST', async () => {
    const response = await controller.getVehicleRcDetailsPost({
      vehicle_number: 'PY01MW8769',
      verification_id: 'test001',
      dealer_id: 1,
    });

    expect(response.is_success).toBe(true);
    expect(response.data).toEqual(mockResponse);
    expect(cashfreeService.getVehicleRcDetails).toHaveBeenCalledWith(
      {
        vehicle_number: 'PY01MW8769',
        verification_id: 'test001',
        dealer_id: 1,
      },
      1,
    );
  });

  it('should get vehicle RC details via param GET', async () => {
    const response = await controller.getVehicleRcDetailsByParam('PY01MW8769', 'test001', 1);

    expect(response.is_success).toBe(true);
    expect(response.data).toEqual(mockResponse);
    expect(cashfreeService.getVehicleRcDetails).toHaveBeenCalledWith(
      {
        vehicle_number: 'PY01MW8769',
        verification_id: 'test001',
        dealer_id: 1,
      },
      1,
    );
  });

  it('should get vehicle RC details via query GET', async () => {
    const response = await controller.getVehicleRcDetailsByQuery('PY01MW8769', undefined, 1);

    expect(response.is_success).toBe(true);
    expect(response.data).toEqual(mockResponse);
    expect(cashfreeService.getVehicleRcDetails).toHaveBeenCalledWith(
      {
        vehicle_number: 'PY01MW8769',
        verification_id: undefined,
        dealer_id: 1,
      },
      1,
    );
  });

  it('should get vehicle RC usage status via GET', async () => {
    const response = await controller.getUsage(1);

    expect(response.is_success).toBe(true);
    expect(response.data).toEqual(mockUsage);
    expect(cashfreeService.getRcUsage).toHaveBeenCalledWith(1);
  });
});
