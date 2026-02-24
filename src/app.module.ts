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

@Module({
  imports: [
    ResponseModule,
    TypedConfigModule,
    JwtModule,
    VendorModule,
    VendorBankDetailModule,
    AuthModule,
    DriverModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
