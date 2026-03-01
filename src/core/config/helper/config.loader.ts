import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { getConfigNamespace, getDefaultValue } from './config.decorator';

/**
 * Enhanced error formatting for validation failures
 */
function formatValidationErrors(
  errors: ValidationError[],
  namespace: string,
): string {
  const header = `\n${'═'.repeat(60)}\n🚫 Configuration Validation Failed: [${namespace}]\n${'═'.repeat(60)}`;

  const messages = errors
    .map((error) => {
      const constraints = Object.values(error.constraints ?? {});
      const value =
        error.value !== undefined
          ? ` (received: ${JSON.stringify(error.value)})`
          : '';

      return `  ❌ ${error.property}${value}\n     ${constraints.map((c) => `→ ${c}`).join('\n     ')}`;
    })
    .join('\n\n');

  const footer = `${'═'.repeat(60)}\n`;

  return `${header}\n\n${messages}\n\n${footer}`;
}

/**
 * Create a config loader from a configuration class
 * This replaces the need for separate validation classes
 *
 * @param ConfigClass - The configuration class decorated with @ConfigNamespace
 * @returns A NestJS registerAs factory function
 *
 * @example
 * ```typescript
 * @ConfigNamespace('database')
 * export class DatabaseConfig {
 *   @IsString()
 *   DB_HOST: string;
 * }
 *
 * export const databaseConfig = createConfigLoader(DatabaseConfig);
 * ```
 */
export function createConfigLoader<T extends object>(
  ConfigClass: new () => T,
): ReturnType<typeof registerAs> {
  const namespace = getConfigNamespace(ConfigClass);

  if (!namespace) {
    throw new Error(
      `Configuration class ${ConfigClass.name} is missing @ConfigNamespace decorator`,
    );
  }

  return registerAs(namespace, () => {
    // Create instance and apply defaults
    const instance = new ConfigClass();
    const proto = Object.getPrototypeOf(instance);

    // Apply default values from @Default decorator
    for (const key of Object.keys(instance)) {
      const defaultValue = getDefaultValue(proto, key);
      if (defaultValue !== undefined && process.env[key] === undefined) {
        (instance as any)[key] = defaultValue;
      } else if (process.env[key] !== undefined) {
        (instance as any)[key] = process.env[key];
      }
    }

    // Transform and validate
    const transformed = plainToInstance(ConfigClass, instance, {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    });

    const errors = validateSync(transformed, {
      skipMissingProperties: false,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new Error(formatValidationErrors(errors, namespace));
    }

    return transformed;
  });
}

/**
 * Validate all environment variables at once using multiple config classes
 * This provides a unified validation experience
 */
export function validateEnvironment(
  configClasses: Array<new () => any>,
): (config: Record<string, unknown>) => Record<string, any> {
  return (envConfig: Record<string, unknown>) => {
    const validatedConfigs: Record<string, any> = {};

    for (const ConfigClass of configClasses) {
      const namespace = getConfigNamespace(ConfigClass);
      if (!namespace) {
        throw new Error(
          `Configuration class ${ConfigClass.name} is missing @ConfigNamespace decorator`,
        );
      }

      try {
        const instance = plainToInstance(ConfigClass, envConfig, {
          enableImplicitConversion: true,
          exposeDefaultValues: true,
        });

        const errors = validateSync(instance, {
          skipMissingProperties: false,
          whitelist: true,
          forbidNonWhitelisted: false, // Allow other env vars for other configs
        });

        if (errors.length > 0) {
          throw new Error(formatValidationErrors(errors, namespace));
        }

        validatedConfigs[namespace] = instance;
      } catch (error) {
        // Re-throw with better context
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(
          `Failed to validate configuration [${namespace}]: ${error}`,
        );
      }
    }

    return envConfig as any; // Return original for NestJS ConfigModule
  };
}
