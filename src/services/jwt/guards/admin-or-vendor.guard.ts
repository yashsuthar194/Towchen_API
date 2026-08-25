import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Guard to ensure the authenticated user is an Admin, SuperAdmin, or Vendor
 *
 * @remarks
 * This guard should be used in combination with JwtAuthGuard.
 */
@Injectable()
export class AdminOrVendorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (
      user.type !== Role.Admin &&
      user.type !== Role.SuperAdmin &&
      user.type !== Role.Vendor
    ) {
      throw new ForbiddenException('Insufficient permissions. Admin or Vendor access required.');
    }

    return true;
  }
}
