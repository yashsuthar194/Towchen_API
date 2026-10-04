import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConsentRole, Role } from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CONSENT_ROLE_KEY } from '../decorators/require-consent-role.decorator';
import { JwtPayload } from 'src/services/jwt/interfaces/jwt-payload.interface';

@Injectable()
export class ConsentRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.getAllAndOverride<ConsentRole>(
      CONSENT_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // SuperAdmin has full administrative authority across all consent steps
    if (user.type === Role.SuperAdmin) {
      return true;
    }

    if (user.type !== Role.Admin) {
      throw new ForbiddenException(
        `Insufficient permissions. Only Administrators with '${requiredRole}' role can perform this action.`,
      );
    }

    // Fetch the admin record to check assigned consent roles
    const admin = await this.prisma.admin.findUnique({
      where: { id: user.id },
      select: { id: true, is_deleted: true, consent_roles: true },
    });

    if (!admin || admin.is_deleted) {
      throw new ForbiddenException('Admin account is inactive or not found.');
    }

    const hasRole = admin.consent_roles.includes(requiredRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Action requires '${requiredRole}' consent role. Your current consent roles: [${admin.consent_roles.join(', ') || 'None'}].`,
      );
    }

    return true;
  }
}
