import { Module } from '@nestjs/common';
import { VehicleClassMappingController } from './vehicle-class-mapping.controller';
import { VehicleClassMappingService } from './vehicle-class-mapping.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { JwtModule } from 'src/services/jwt/jwt.module';
import { StorageModule } from 'src/services/storage/storage.module';

@Module({
  imports: [PrismaModule, JwtModule, StorageModule],
  controllers: [VehicleClassMappingController],
  providers: [VehicleClassMappingService],
  exports: [VehicleClassMappingService],
})
export class VehicleClassMappingModule {}
