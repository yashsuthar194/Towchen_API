import { Test, TestingModule } from '@nestjs/testing';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { CallerService } from 'src/services/jwt/caller.service';
import { CashfreeService } from 'src/services/cashfree/cashfree.service';

describe('VehicleController', () => {
  let controller: VehicleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleController],
      providers: [
        { provide: VehicleService, useValue: {} },
        { provide: CallerService, useValue: {} },
        { provide: CashfreeService, useValue: {} },
      ],
    }).compile();

    controller = module.get<VehicleController>(VehicleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
