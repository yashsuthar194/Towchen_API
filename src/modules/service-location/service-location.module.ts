import { Module } from '@nestjs/common';
import { ServiceLocationController } from './service-location.controller';
import { ServiceLocationService } from './service-location.service';
import { MapsModule } from 'src/services/maps/maps.module';

@Module({
  imports: [MapsModule], // needed for resolving Google Place IDs
  controllers: [ServiceLocationController],
  providers: [ServiceLocationService],
  exports: [ServiceLocationService], // exported so VendorService can use it at registration
})
export class ServiceLocationModule {}
