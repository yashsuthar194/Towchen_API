import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { TypedConfigService } from 'src/core/config/typed-config.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtTokens } from './types/jwt-token.type';

/**
 * Service for handling JWT token generation, validation, and verification
 *
 * @remarks
 * This service wraps @nestjs/jwt to provide application-specific JWT operations
 * including access token and refresh token generation with configurable expiration.
 *
 * Token Lifetimes:
 * - Access Token: Configured via JWT_EXPIRES_IN (default: 7d)
 * - Refresh Token: 30 days (fixed)
 *
 * @example
 * ```typescript
 * const tokens = await jwtService.generateTokens({
 *   sub: vendor.id,
 *   email: vendor.email,
 *   type: 'vendor'
 * });
 * ```
 */
@Injectable()
export class JwtService {
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string = '30d';

  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly config: TypedConfigService,
  ) {
    this.accessTokenExpiry = this.config.jwt.expiresIn;
  }

  /**
   * Generates both access and refresh tokens for a user
   *
   * @param payload - The JWT payload containing user identification
   * @returns Object containing both access_token and refresh_token
   *
   * @example
   * ```typescript
   * const tokens = await jwtService.generateTokens({
   *   sub: '123',
   *   email: 'user@example.com',
   *   type: 'vendor'
   * });
   * ```
   */
  async generateTokens(payload: JwtPayload): Promise<JwtTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Generates a short-lived access token
   *
   * @param payload - The JWT payload
   * @returns The signed access token
   */
  private async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.nestJwtService.signAsync(payload as any, {
      secret: this.config.jwt.secret,
      expiresIn: this.accessTokenExpiry as any,
    });
  }

  /**
   * Generates a long-lived refresh token
   *
   * @param payload - The JWT payload
   * @returns The signed refresh token
   */
  private async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.nestJwtService.signAsync(payload as any, {
      secret: this.config.jwt.secret,
      expiresIn: this.refreshTokenExpiry as any,
    });
  }

  /**
   * Verifies and decodes a JWT token
   *
   * @param token - The JWT token to verify
   * @returns The decoded JWT payload
   * @throws {UnauthorizedException} If token is invalid or expired
   *
   * @example
   * ```typescript
   * try {
   *   const payload = await jwtService.verifyToken(token);
   *   console.log(payload.sub); // User ID
   * } catch (error) {
   *   // Handle invalid token
   * }
   * ```
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.nestJwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.jwt.secret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Decodes a JWT token without verifying its signature
   *
   * @param token - The JWT token to decode
   * @returns The decoded JWT payload or null if invalid
   *
   * @remarks
   * Use this method only when you need to inspect token contents without validation.
   * For authentication purposes, always use verifyToken() instead.
   */
  decode(token: string): JwtPayload | null {
    return this.nestJwtService.decode<JwtPayload>(token);
  }

  /**
   * Refreshes an access token using a refresh token
   *
   * @param refreshToken - The refresh token
   * @returns New JWT tokens (access and refresh)
   * @throws {UnauthorizedException} If refresh token is invalid or expired
   *
   * @example
   * ```typescript
   * const newTokens = await jwtService.refreshAccessToken(oldRefreshToken);
   * ```
   */
  async refreshAccessToken(refreshToken: string): Promise<JwtTokens> {
    const payload = await this.verifyToken(refreshToken);

    // Remove iat and exp from payload for new token generation
    const { iat, exp, ...newPayload } = payload;

    return this.generateTokens(newPayload);
  }
}
