// src/config/namespaces/database.config.ts
import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  name: process.env.DB_NAME,
  user: process.env.DB_USER,
  pass: process.env.DB_PASS,

  // Convenience getter — useful for TypeORM / Prisma datasource
  get url(): string {
    return `postgresql://${this.user}:${this.pass}@${this.host}:${this.port}/${this.name}`;
  },
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
