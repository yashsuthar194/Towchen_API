import {
  Injectable,
  Scope,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { JwtService } from './jwt.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

/**
 * Request-scoped service providing access to the current authenticated user's JWT payload
 *
 * @remarks
 * This service is REQUEST-scoped, meaning a new instance is created for each HTTP request.
 * It extracts the JWT token from the Authorization header and provides the decoded payload.
 *
 * The token is decoded lazily (only when first accessed) and cached for the request lifecycle.
 *
 * **Use Cases:**
 * - Access current user in services without passing through method parameters
 * - Audit logging with automatic user tracking
 * - Multi-tenant applications filtering by current user
 * - Authorization checks in business logic
 *
 * @example
 * In any service:
 * ```typescript
 * @Injectable()
 * export class VendorService {
 *   constructor(private readonly callerService: CallerService) {}
 *
 *   async getMyVendors() {
 *     const userId = this.callerService.getUserId();
 *     return this.prisma.vendor.findMany({ where: { userId } });
 *   }
 * }
 * ```
 *
 * @example
 * Get full payload:
 * ```typescript
 * const caller = this.callerService.getCaller();
 * console.log(caller.id, caller.email, caller.type);
 * ```
 *
 * @example
 * Check if user is vendor:
 * ```typescript
 * if (this.callerService.isVendor()) {
 *   // Vendor-specific logic
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class CallerService {
  private _caller: JwtPayload | null | undefined = undefined;
  private _token: string | null = null;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Extracts the JWT token from the Authorization header
   *
   * @returns The JWT token without the "Bearer " prefix, or null if not found
   * @private
   */
  private extractToken(): string | null {
    if (this._token !== null) {
      return this._token;
    }

    const authHeader = this.request.headers?.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      this._token = null;
      return null;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      this._token = null;
      return null;
    }

    this._token = token;
    return token;
  }

  /**
   * Gets the authenticated user's JWT payload
   *
   * @returns The JWT payload of the current authenticated user
   * @throws {UnauthorizedException} If no token is present or token is invalid
   *
   * @example
   * ```typescript
   * const caller = this.callerService.getCaller();
   * console.log(caller.id);    // User ID
   * console.log(caller.email); // User email
   * console.log(caller.type);  // Role.Vendor or Role.Driver
   * ```
   */
  getCaller(): JwtPayload {
    // Return cached result if already decoded
    if (this._caller !== undefined) {
      if (this._caller === null) {
        throw new UnauthorizedException('Authentication required');
      }
      return this._caller;
    }

    // Extract and verify token
    const token = this.extractToken();

    if (!token) {
      this._caller = null;
      throw new UnauthorizedException('Authentication required');
    }

    try {
      // Verify and decode the token
      const payload = this.jwtService.decode(token);

      if (!payload) {
        this._caller = null;
        throw new UnauthorizedException('Invalid token');
      }

      this._caller = payload;
      return payload;
    } catch (error) {
      this._caller = null;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Gets the authenticated user's JWT payload, or null if not authenticated
   *
   * @returns The JWT payload or null if no valid token is present
   *
   * @example
   * ```typescript
   * const caller = this.callerService.getCallerOrNull();
   * if (caller) {
   *   console.log(`Authenticated user: ${caller.email}`);
   * } else {
   *   console.log('Anonymous user');
   * }
   * ```
   */
  getCallerOrNull(): JwtPayload | null {
    try {
      return this.getCaller();
    } catch {
      return null;
    }
  }

  /**
   * Gets the authenticated user's ID
   *
   * @returns The user ID
   * @throws {UnauthorizedException} If not authenticated
   *
   * @example
   * ```typescript
   * const userId = this.callerService.getUserId();
   * const vendor = await this.prisma.vendor.findUnique({ where: { id: userId } });
   * ```
   */
  getUserId(): number {
    return this.getCaller().id;
  }

  /**
   * Gets the authenticated user's email
   *
   * @returns The user email
   * @throws {UnauthorizedException} If not authenticated
   *
   * @example
   * ```typescript
   * const email = this.callerService.getUserEmail();
   * await this.emailService.sendWelcome(email);
   * ```
   */
  getUserEmail(): string {
    return this.getCaller().email;
  }

  /**
   * Gets the authenticated user's role type
   *
   * @returns The user role (Role.Vendor or Role.Driver)
   * @throws {UnauthorizedException} If not authenticated
   *
   * @example
   * ```typescript
   * const role = this.callerService.getUserType();
   * if (role === Role.Vendor) {
   *   // Vendor-specific logic
   * }
   * ```
   */
  getUserType() {
    return this.getCaller().type;
  }

  /**
   * Checks if the current user is authenticated
   *
   * @returns True if a valid JWT token is present
   *
   * @example
   * ```typescript
   * if (this.callerService.isAuthenticated()) {
   *   return this.getPersonalizedContent();
   * } else {
   *   return this.getPublicContent();
   * }
   * ```
   */
  isAuthenticated(): boolean {
    return this.getCallerOrNull() !== null;
  }

  /**
   * Checks if the current user is a vendor
   *
   * @returns True if authenticated and user type is Vendor
   *
   * @example
   * ```typescript
   * if (!this.callerService.isVendor()) {
   *   throw new ForbiddenException('Vendor access required');
   * }
   * ```
   */
  isVendor(): boolean {
    const caller = this.getCallerOrNull();
    return caller?.type === 'Vendor';
  }

  /**
   * Checks if the current user is a driver
   *
   * @returns True if authenticated and user type is Driver
   *
   * @example
   * ```typescript
   * if (!this.callerService.isDriver()) {
   *   throw new ForbiddenException('Driver access required');
   * }
   * ```
   */
  isDriver(): boolean {
    const caller = this.getCallerOrNull();
    return caller?.type === 'Driver';
  }

  /**
   * Gets the raw JWT token string
   *
   * @returns The JWT token or null if not present
   *
   * @example
   * ```typescript
   * const token = this.callerService.getToken();
   * await this.externalService.callApi(token);
   * ```
   */
  getToken(): string | null {
    return this.extractToken();
  }
}
