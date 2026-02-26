import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Role } from '@prisma/client';

/**
 * Guard to ensure the authenticated user is a driver
 *
 * @remarks
 * This guard should be used in combination with JwtAuthGuard.
 * It checks that the authenticated user's type is 'driver'.
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, DriverGuard)
 * @Get('driver-only')
 * driverOnlyRoute(@Request() req) {
 *   // Only drivers can access this
 *   return req.user;
 * }
 * ```
 */
@Injectable()
export class DriverGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    return user?.type === Role.Driver;
  }
}
