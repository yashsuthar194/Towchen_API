// src/config/env.validation.ts
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
import { NodeEnv } from './envs/app.env';
import { StorageProvider } from './envs/storage.env';

// ─── Flat class covering ALL env vars ────────────────────────────────────────
// class-validator works on a flat object, so we mirror every env var here.
// The namespace configs (registerAs) will pick from this validated object.
export class EnvironmentVariables {
  // #region App
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  // #region Database
  @IsString()
  @MinLength(1)
  DB_HOST: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  DB_PORT: number = 5432;

  @IsString()
  @MinLength(1)
  DB_NAME: string;

  @IsString()
  @MinLength(1)
  DB_USER: string;

  @IsString()
  @MinLength(1)
  DB_PASS: string;

  // #region JWT
  @IsString()
  @MinLength(10, { message: 'JWT_SECRET must be at least 10 characters long' })
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  // #region Storage
  @IsEnum(StorageProvider)
  STORAGE_PROVIDER: StorageProvider;

  @IsString()
  @IsNotEmpty()
  R2_ACCOUNT_ID: string;

  @IsString()
  @IsNotEmpty()
  R2_ACCESS_KEY_ID: string;

  @IsString()
  @IsNotEmpty()
  R2_SECRET_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  R2_BUCKET_NAME: string;

  @IsString()
  @IsNotEmpty()
  R2_PUBLIC_URL: string;
}

// ─── Validation function passed to ConfigModule ───────────────────────────────
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  // plainToInstance handles type coercion (string → number, etc.)
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true, // coerce "3000" → 3000 automatically
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false, // all required fields must be present
    whitelist: true, // strip unknown env vars
  });

  if (errors.length > 0) {
    const messages = errors
      .map((err) => {
        const constraints = Object.values(err.constraints ?? {}).join(', ');
        return `  ✗ [${err.property}]: ${constraints}`;
      })
      .join('\n');

    throw new Error(`\nConfig validation failed:\n${messages}\n`);
  }

  return validated;
}
