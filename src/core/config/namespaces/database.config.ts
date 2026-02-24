import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ConfigNamespace } from '../helper/config.decorator';
import { createConfigLoader } from '../helper/config.loader';

@ConfigNamespace('database')
export class DatabaseConfig {
  @IsString({ message: 'DB_HOST must be a string' })
  @MinLength(1, { message: 'DB_HOST is required and cannot be empty' })
  DB_HOST: string;

  @IsInt({ message: 'DB_PORT must be a valid integer' })
  @Min(1, { message: 'DB_PORT must be at least 1' })
  @Max(65535, { message: 'DB_PORT must be at most 65535' })
  @IsOptional()
  DB_PORT: number = 5432;

  @IsString({ message: 'DB_NAME must be a string' })
  @MinLength(1, { message: 'DB_NAME is required and cannot be empty' })
  DB_NAME: string;

  @IsString({ message: 'DB_USER must be a string' })
  @MinLength(1, { message: 'DB_USER is required and cannot be empty' })
  DB_USER: string;

  @IsString({ message: 'DB_PASS must be a string' })
  @MinLength(1, { message: 'DB_PASS is required and cannot be empty' })
  DB_PASS: string;

  // Computed properties
  get host(): string {
    return this.DB_HOST;
  }

  get port(): number {
    return this.DB_PORT;
  }

  get name(): string {
    return this.DB_NAME;
  }

  get user(): string {
    return this.DB_USER;
  }

  get pass(): string {
    return this.DB_PASS;
  }

  // Convenience getter for Prisma/TypeORM
  get url(): string {
    return `postgresql://${this.user}:${this.pass}@${this.host}:${this.port}/${this.name}`;
  }
}

// Export the loader for use in the module
export const databaseConfig = createConfigLoader(DatabaseConfig);
