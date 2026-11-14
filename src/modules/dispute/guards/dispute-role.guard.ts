import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DisputeRole, Role } from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { DISPUTE_ROLE_KEY } from '../decorators/require-dispute-role.decorator';
import { JwtPayload } from 'src/services/jwt/interfaces/jwt-payload.interface';

@Injectable()
export class DisputeRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<DisputeRole>(
      DISPUTE_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated.');
    }

    // SuperAdmin has full administrative authority across all DMS steps
    if (user.type === Role.SuperAdmin) {
      return true;
    }

    if (user.type !== Role.Admin) {
      throw new ForbiddenException(
        `Insufficient permissions. Only Administrators with '${requiredRole}' role can perform this action.`,
      );
    }

    // Fetch the admin record to check assigned dispute roles
    const admin = await this.prisma.admin.findUnique({
      where: { id: user.id },
      select: { id: true, is_deleted: true, dispute_roles: true, consent_roles: true },
    });

    if (!admin || admin.is_deleted) {
      throw new ForbiddenException('Admin account is inactive or not found.');
    }

    const hasDirectRole = admin.dispute_roles && admin.dispute_roles.includes(requiredRole);
    // Backward-compatible fallback to consent_roles if dispute_roles is not yet seeded
    const hasConsentRoleFallback =
      admin.consent_roles && admin.consent_roles.includes(requiredRole as any);

    if (!hasDirectRole && !hasConsentRoleFallback) {
      throw new ForbiddenException(
        `Action requires '${requiredRole}' dispute role. Your current dispute roles: [${(admin.dispute_roles || []).join(', ') || 'None'}].`,
      );
    }

    return true;
  }
}
