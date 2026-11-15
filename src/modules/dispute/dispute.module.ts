import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/core/prisma/prisma.module';
import { JwtModule } from 'src/services/jwt/jwt.module';
import { StorageModule } from 'src/services/storage/storage.module';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';
import { DisputeRoleGuard } from './guards/dispute-role.guard';

@Module({
  imports: [PrismaModule, JwtModule, StorageModule],
  controllers: [DisputeController],
  providers: [DisputeService, DisputeRoleGuard],
  exports: [DisputeService],
})
export class DisputeModule {}
