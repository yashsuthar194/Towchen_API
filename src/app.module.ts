import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VendorModule } from './modules/vendor/vendor.module';
import { VendorBankDetailModule } from './modules/vendor-bank-detail/vendor-bank-detail.module';
import { TypedConfigModule } from './core/config/typed-config.module';
import { ResponseModule } from './core/response/response.module';
import { AuthModule } from './modules/auth/auth.module';
import { DriverModule } from './modules/driver/driver.module';
import { JwtModule } from './services/jwt/jwt.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DriverLocationModule } from './modules/driver-location/driver-location.module';
import { SharedModule } from './shared/shared.module';
import { LogModule } from './modules/log/log.module';
import { OrderModule } from './modules/order/order.module';
import { ServiceModule } from './modules/service/service.module';

@Module({
  imports: [
    ResponseModule,
    TypedConfigModule,
    JwtModule,
    VendorModule,
    VendorBankDetailModule,
    AuthModule,
    DriverModule,
    VehicleModule,
    CustomerModule,
    DriverLocationModule,
    SharedModule,
    LogModule,
    OrderModule,
    ServiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
