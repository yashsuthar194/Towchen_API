import { Module } from '@nestjs/common';
import { DbExplorerController } from './db-explorer.controller';
import { DbExplorerService } from './db-explorer.service';

/**
 * DbExplorerModule
 *
 * Developer tool for inspecting, browsing, and querying database tables and data.
 * PrismaService is injected automatically because PrismaModule is @Global.
 */
@Module({
  controllers: [DbExplorerController],
  providers: [DbExplorerService],
  exports: [DbExplorerService],
})
export class DbExplorerModule {}
