import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Guard to ensure the authenticated user is a SuperAdmin
 *
 * @remarks
 * This guard should be used in combination with JwtAuthGuard.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.type !== Role.SuperAdmin) {
      throw new ForbiddenException('Insufficient permissions. SuperAdmin access required.');
    }

    return true;
  }
}
