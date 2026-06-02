import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Role } from '@prisma/client';

/**
 * Guard to ensure the authenticated user is a customer
 *
 * @remarks
 * This guard should be used in combination with JwtAuthGuard.
 */
@Injectable()
export class CustomerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    return user?.type === Role.Customer;
  }
}
