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
import { LocationModule } from './modules/location/location.module';
import { CustomerAddressModule } from './modules/customer-address/customer-address.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { SubServiceConditionModule } from './modules/sub-service-condition/sub-service-condition.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { VoucherModule } from './modules/voucher/voucher.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Global scheduler — must be here, not in feature modules
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
    LocationModule,
    CustomerAddressModule,
    DispatchModule,
    SubServiceConditionModule,
    WalletModule,
    VoucherModule
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
