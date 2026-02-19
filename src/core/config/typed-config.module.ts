import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';
import { appConfig } from './namespaces/app.config';
import { databaseConfig } from './namespaces/database.config';
import { jwtConfig } from './namespaces/jwt.config';
import { TypedConfigService } from './typed-config.service';
import { storageConfig } from './namespaces/storage.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      load: [appConfig, databaseConfig, jwtConfig, storageConfig],
      validate: validateEnv,
    }),
  ],
  providers: [TypedConfigService],
  exports: [TypedConfigService],
})
export class TypedConfigModule {}
