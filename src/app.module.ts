import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VendorModule } from './modules/vendor/vendor.module';
import { VendorBankDetailModule } from './modules/vendor-bank-detail/vendor-bank-detail.module';
import { TypedConfigModule } from './core/config/typed-config.module';

@Module({
  imports: [TypedConfigModule, VendorModule, VendorBankDetailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
