import { Module } from '@nestjs/common';
import { MapsModule } from 'src/services/maps/maps.module';
import { DispatchService } from './dispatch.service';

@Module({
  imports: [MapsModule],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
