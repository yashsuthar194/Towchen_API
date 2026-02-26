import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT authentication guard for protecting routes
 *
 * @remarks
 * This guard uses the 'jwt' Passport strategy to authenticate requests.
 * Apply this guard to any route or controller that requires authentication.
 *
 * The authenticated user's payload will be available in request.user.
 *
 * @example
 * Protect a single route:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Request() req) {
 *   return req.user;
 * }
 * ```
 *
 * @example
 * Protect an entire controller:
 * ```typescript
 * @Controller('vendors')
 * @UseGuards(JwtAuthGuard)
 * export class VendorController {
 *   // All routes are protected
 * }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
