import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './namespaces/app.config';
import { DatabaseConfig } from './namespaces/database.config';
import { JwtConfig } from './namespaces/jwt.config';
import { MailConfig } from './namespaces/mail.config';
import { SmsConfig } from './namespaces/sms.config';
import { StorageConfig } from './namespaces/storage.config';
import { VerificationConfig } from './namespaces/verification.config';

/**
 * Type-safe configuration service providing access to all config namespaces.
 *
 * Usage:
 * ```typescript
 * constructor(private config: TypedConfigService) {}
 *
 * // Access config with full type safety and auto-completion
 * const port = this.config.app.port;
 * const dbUrl = this.config.database.url;
 * ```
 */
@Injectable()
export class TypedConfigService {
  constructor(private readonly config: ConfigService) { }

  /**
   * Get application configuration
   */
  get app(): AppConfig {
    return this.config.get<AppConfig>('app')!;
  }

  /**
   * Get database configuration
   */
  get database(): DatabaseConfig {
    return this.config.get<DatabaseConfig>('database')!;
  }

  /**
   * Get JWT configuration
   */
  get jwt(): JwtConfig {
    return this.config.get<JwtConfig>('jwt')!;
  }

  /**
   * Get storage configuration
   */
  get storage(): StorageConfig {
    return this.config.get<StorageConfig>('storage')!;
  }

  /**
   * Get mail configuration
   */
  get mail(): MailConfig {
    return this.config.get<MailConfig>('mail')!;
  }

  /**
   * Get SMS configuration
   */
  get sms(): SmsConfig {
    return this.config.get<SmsConfig>('sms')!;
  }

  get verification(): VerificationConfig {
    return this.config.get<VerificationConfig>('verification')!;
  }
}
