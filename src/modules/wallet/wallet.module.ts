import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PrismaModule } from 'src/core/prisma/prisma.module';

@Module({
  providers: [WalletService],
  controllers: [WalletController],
  imports: [PrismaModule],
  exports: [WalletService]
})
export class WalletModule {}
