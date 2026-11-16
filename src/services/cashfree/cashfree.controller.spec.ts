import { Test, TestingModule } from '@nestjs/testing';
import { CashfreeController } from './cashfree.controller';
import { CashfreeService } from './cashfree.service';

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

  const mockCashfreeService = {
    getVehicleRcDetails: jest.fn().mockResolvedValue(mockResponse),
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
    });

    expect(response.is_success).toBe(true);
    expect(response.data).toEqual(mockResponse);
    expect(cashfreeService.getVehicleRcDetails).toHaveBeenCalledWith({
      vehicle_number: 'PY01MW8769',
      verification_id: 'test001',
    });
  });

  it('should get vehicle RC details via param GET', async () => {
    const response = await controller.getVehicleRcDetailsByParam('PY01MW8769', 'test001');

    expect(response.is_success).toBe(true);
    expect(response.data).toEqual(mockResponse);
  });

  it('should get vehicle RC details via query GET', async () => {
    const response = await controller.getVehicleRcDetailsByQuery('PY01MW8769');

    expect(response.is_success).toBe(true);
    expect(response.data).toEqual(mockResponse);
  });
});

