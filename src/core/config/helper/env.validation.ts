// src/config/env.validation.ts
import { validateEnvironment } from './config.loader';
import { AppConfig } from '../namespaces/app.config';
import { DatabaseConfig } from '../namespaces/database.config';
import { JwtConfig } from '../namespaces/jwt.config';
import { StorageConfig } from '../namespaces/storage.config';

/**
 * Unified environment validation using all config classes.
 * This replaces the need for a separate EnvironmentVariables class.
 *
 * To add a new config:
 * 1. Create a new config class with @ConfigNamespace decorator
 * 2. Add it to the array below
 * 3. That's it! No other files to modify.
 */
export const validateEnv = validateEnvironment([
  AppConfig,
  DatabaseConfig,
  JwtConfig,
  StorageConfig,
]);
