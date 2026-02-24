import { Global, Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from './jwt.service';
import { CallerService } from './caller.service';
import { TypedConfigModule } from 'src/core/config/typed-config.module';
import { TypedConfigService } from 'src/core/config/typed-config.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from 'src/core/prisma/prisma.module';

/**
 * Global JWT module providing JWT token services throughout the application
 *
 * @remarks
 * This module is marked as @Global() so it doesn't need to be imported in every module.
 * It wraps @nestjs/jwt and provides a custom JwtService with application-specific logic.
 *
 * Configuration is loaded from environment variables:
 * - JWT_SECRET: Secret key for signing tokens (required, min 10 characters)
 * - JWT_EXPIRES_IN: Token expiration time (optional, default: '7d')
 *
 * @example
 * Import once in AppModule:
 * ```typescript
 * @Module({
 *   imports: [JwtModule],
 * })
 * export class AppModule {}
 * ```
 *
 * Use in any service without importing:
 * ```typescript
 * constructor(private readonly jwtService: JwtService) {}
 * ```
 */
@Global()
@Module({
  imports: [
    TypedConfigModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    NestJwtModule.registerAsync({
      imports: [TypedConfigModule],
      inject: [TypedConfigService],
      useFactory: (config: TypedConfigService) => ({
        secret: config.jwt.secret,
        signOptions: {
          expiresIn: config.jwt.expiresIn as any,
        },
      }),
    }),
  ],
  providers: [JwtService, JwtStrategy, CallerService],
  exports: [JwtService, PassportModule, CallerService],
})
export class JwtModule {}
