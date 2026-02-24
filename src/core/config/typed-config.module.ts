import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './helper/env.validation';
import { appConfig } from './namespaces/app.config';
import { databaseConfig } from './namespaces/database.config';
import { jwtConfig } from './namespaces/jwt.config';
import { mailConfig } from './namespaces/mail.config';
import { smsConfig } from './namespaces/sms.config';
import { storageConfig } from './namespaces/storage.config';
import { verificationConfig } from './namespaces/verification.config';
import { TypedConfigService } from './typed-config.service';

/**
 * Global configuration module providing type-safe access to environment variables.
 *
 * To add a new configuration:
 * 1. Create a new file in `namespaces/` like `email.config.ts`
 * 2. Define your config class with @ConfigNamespace decorator and validators
 * 3. Export it using createConfigLoader()
 * 4. Import and add to the `load` array below
 * 5. Add a getter in TypedConfigService
 * 6. Add the class to validateEnv in env.validation.ts
 *
 * That's it! Your config is now available throughout the app with full type safety.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      load: [appConfig, databaseConfig, jwtConfig, mailConfig, smsConfig, storageConfig, verificationConfig],
      validate: validateEnv,
    }),
  ],
  providers: [TypedConfigService],
  exports: [TypedConfigService],
})
export class TypedConfigModule { }
