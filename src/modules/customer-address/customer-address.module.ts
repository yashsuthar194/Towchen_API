import { Module } from '@nestjs/common';
import { CustomerAddressService } from './customer-address.service';
import { CustomerAddressController } from './customer-address.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { LocationModule } from '../location/location.module';
import { JwtModule } from 'src/services/jwt/jwt.module';

@Module({
  imports: [PrismaModule, JwtModule, LocationModule],
  controllers: [CustomerAddressController],
  providers: [CustomerAddressService],
  exports: [CustomerAddressService],
})
export class CustomerAddressModule {}
