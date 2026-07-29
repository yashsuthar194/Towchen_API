import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Guard to ensure the authenticated user is an Admin or SuperAdmin
 *
 * @remarks
 * This guard should be used in combination with JwtAuthGuard.
 * It checks the `type` property of the validated JWT payload.
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, AdminGuard)
 * @Get('dashboard')
 * getAdminDashboard() { ... }
 * ```
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.type !== Role.Admin && user.type !== Role.SuperAdmin) {
      throw new ForbiddenException('Insufficient permissions. Admin access required.');
    }

    return true;
  }
}
