import { Module } from '@nestjs/common';
import { LogService } from './log.service';
import { LogController } from './log.controller';

/**
 * LogModule
 *
 * Provides:
 *  - LogService  — fire-and-forget API call logging (used globally by ResponseModule)
 *  - LogController — public GET /logs endpoints for the dashboard web app
 *
 * PrismaService is injected automatically (PrismaModule is @Global).
 */
@Module({
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
