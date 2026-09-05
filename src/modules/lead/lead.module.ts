import { Module } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { MapsModule } from 'src/services/maps/maps.module';

@Module({
  imports: [MapsModule],
  controllers: [LeadController],
  providers: [LeadService],
})
export class LeadModule {}
