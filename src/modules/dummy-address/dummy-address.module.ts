import { Module } from '@nestjs/common';
import { DummyAddressController } from './dummy-address.controller';
import { DummyAddressService } from './dummy-address.service';

@Module({
  controllers: [DummyAddressController],
  providers: [DummyAddressService],
})
export class DummyAddressModule {}
