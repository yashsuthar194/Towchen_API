import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { MapsModule } from 'src/services/maps/maps.module';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [MapsModule, DispatchModule],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule { }
