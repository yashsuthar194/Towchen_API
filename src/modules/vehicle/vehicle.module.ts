import { Module } from '@nestjs/common';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { StorageModule } from 'src/services/storage/storage.module';
import { JwtModule } from 'src/services/jwt/jwt.module';

@Module({
  imports: [PrismaModule, StorageModule, JwtModule],
  controllers: [VehicleController],
  providers: [VehicleService],
})
export class VehicleModule { }
