import { Test, TestingModule } from '@nestjs/testing';
import { CashfreeService } from './cashfree.service';
import { TypedConfigService } from 'src/core/config/typed-config.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('CashfreeService', () => {
  let service: CashfreeService;
  let originalFetch: typeof global.fetch;

  const mockConfigService = {
    cashfree: {
      clientId: 'mock_cashfree_client_id',
      clientSecret: 'mock_cashfree_client_secret',
      baseUrl: 'https://api.cashfree.com/verification',
    },
  };

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashfreeService,
        {
          provide: TypedConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CashfreeService>(CashfreeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully return vehicle RC details when Cashfree responds with 200', async () => {
    const mockCashfreeResponse = {
      verification_id: 'test001',
      reference_id: 12345,
      status: 'VALID',
      reg_no: 'PY01MW8769',
      class: 'Motor Car',
      chassis: 'MALBK511VMM110528',
      engine: 'G3LCMM440323',
      vehicle_manufacturer_name: 'HYUNDAI MOTOR INDIA LTD',
      model: 'I20 N LINE N8',
      fuel_type: 'PETROL',
      owner_name: 'JOHN DOE',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockCashfreeResponse),
    } as any);

    const result = await service.getVehicleRcDetails({
      vehicle_number: 'PY-01-MW-8769',
      verification_id: 'test001',
    });

    expect(result).toEqual(mockCashfreeResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.cashfree.com/verification/vehicle-rc',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': mockConfigService.cashfree.clientId,
          'x-client-secret': mockConfigService.cashfree.clientSecret,
        },
        body: JSON.stringify({
          verification_id: 'test001',
          vehicle_number: 'PY01MW8769',
        }),
      }),
    );
  });

  it('should auto-generate verification_id if not provided', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ status: 'VALID', reg_no: 'PY01MW8769' }),
    } as any);

    await service.getVehicleRcDetails({
      vehicle_number: 'PY01MW8769',
    });

    expect(global.fetch).toHaveBeenCalled();
    const calledBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(calledBody.verification_id).toBeDefined();
    expect(calledBody.verification_id).toMatch(/^rc_/);
    expect(calledBody.vehicle_number).toBe('PY01MW8769');
  });

  it('should throw ForbiddenException on 403 ip_validation_failed', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: jest.fn().mockResolvedValue({
        type: 'authentication_error',
        code: 'ip_validation_failed',
        message: 'IP not whitelisted',
      }),
    } as any);

    await expect(
      service.getVehicleRcDetails({ vehicle_number: 'PY01MW8769' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException on 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({
        message: 'RC details not found',
      }),
    } as any);

    await expect(
      service.getVehicleRcDetails({ vehicle_number: 'XX00XX0000' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if vehicle_number is empty', async () => {
    await expect(
      service.getVehicleRcDetails({ vehicle_number: '' }),
    ).rejects.toThrow(BadRequestException);
  });
});

