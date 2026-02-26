import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Role } from 'generated/prisma/enums';

/**
 * Guard to ensure the authenticated user is a vendor
 *
 * @remarks
 * This guard should be used in combination with JwtAuthGuard.
 * It checks that the authenticated user's type is 'vendor'.
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, VendorGuard)
 * @Get('vendor-only')
 * vendorOnlyRoute(@Request() req) {
 *   // Only vendors can access this
 *   return req.user;
 * }
 * ```
 */
@Injectable()
export class VendorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    return user?.type === Role.Vendor;
  }
}
