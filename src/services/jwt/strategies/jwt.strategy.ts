import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TypedConfigService } from 'src/core/config/typed-config.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { Role } from 'generated/prisma/enums';

/**
 * JWT authentication strategy for Passport
 *
 * @remarks
 * This strategy validates JWT tokens and attaches the user payload to the request.
 * It extracts the token from the Authorization header as a Bearer token.
 *
 * The strategy also verifies that the user still exists in the database.
 *
 * @example
 * Protect routes using the JwtAuthGuard:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Request() req) {
 *   return req.user; // JwtPayload
 * }
 * ```
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: TypedConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
  }

  /**
   * Validates the JWT payload and returns the user information
   *
   * @param payload - The decoded JWT payload
   * @returns The JWT payload if valid
   * @throws {UnauthorizedException} If the user is not found in the database
   *
   * @remarks
   * This method is called automatically by Passport after token verification.
   * The returned value is attached to request.user in protected routes.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Verify the user still exists in the database
    if (payload.type === Role.Vendor) {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: payload.id },
      });

      if (!vendor) {
        throw new UnauthorizedException('Vendor not found');
      }
    } else if (payload.type === Role.Driver) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: payload.id },
      });

      if (!driver) {
        throw new UnauthorizedException('Driver not found');
      }
    }

    return payload;
  }
}
