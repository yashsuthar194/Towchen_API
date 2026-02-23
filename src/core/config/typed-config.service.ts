import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './namespaces/app.config';
import { DatabaseConfig } from './namespaces/database.config';
import { JwtConfig } from './namespaces/jwt.config';
import { StorageConfig } from './namespaces/storage.config';
import { VerificationConfig } from './namespaces/verification.config';

@Injectable()
export class TypedConfigService {
  constructor(private readonly config: ConfigService) { }

  get app(): AppConfig {
    return this.config.get<AppConfig>('app')!;
  }

  get database(): DatabaseConfig {
    return this.config.get<DatabaseConfig>('database')!;
  }

  get jwt(): JwtConfig {
    return this.config.get<JwtConfig>('jwt')!;
  }

  get storage(): StorageConfig {
    return this.config.get<StorageConfig>('storage')!;
  }

  get verification(): VerificationConfig {
    return this.config.get<VerificationConfig>('verification')!;
  }
}
