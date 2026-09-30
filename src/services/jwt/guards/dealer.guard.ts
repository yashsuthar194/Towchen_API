import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Role } from '@prisma/client';

/**
 * Guard to ensure the authenticated user is a dealer
 *
 * @remarks
 * This guard should be used in combination with JwtAuthGuard.
 * It checks that the authenticated user's type is 'Dealer'.
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard, DealerGuard)
 * @Get('dealer-only')
 * dealerOnlyRoute(@Request() req) {
 *   return req.user;
 * }
 * ```
 */
@Injectable()
export class DealerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    return user?.type === Role.Dealer;
  }
}
