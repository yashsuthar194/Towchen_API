import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { JwtModule } from 'src/services/jwt/jwt.module';

@Module({
  imports: [JwtModule],
  controllers: [CustomerController],
  providers: [CustomerService]
})
export class CustomerModule {}
