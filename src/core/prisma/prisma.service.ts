import 'dotenv/config';
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
const adapter = new PrismaPg(pool);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly _logger = new Logger(PrismaService.name);

  constructor() {
    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
        { emit: 'stdout', level: 'info' },
      ],
      errorFormat: 'pretty',
    });

    this.$on('query' as never, (event: { duration: number; query: string }) => {
      // Ignore queries to the logs table to prevent console spam
      if (event.query.includes('"public"."logs"')) {
        return;
      }
      this._logger.warn(`Query time (${event.duration}ms): ${event.query}`);
    });

    this.$on('error' as never, (event: { message: string }) => {
      this._logger.error(`Prisma error: ${event.message}`);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this._logger.log('Database connection established');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this._logger.log('Database connection closed');
  }

  /**
   * Health check: pings the DB with a lightweight query.
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
