import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Decorator to extract the current authenticated user from the request
 *
 * @remarks
 * This decorator must be used in combination with JwtAuthGuard.
 * It extracts the JWT payload that was attached to request.user by the JWT strategy.
 *
 * @example
 * Get the full user payload:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return user;
 * }
 * ```
 *
 * @example
 * Get a specific field:
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('my-data')
 * getMyData(@CurrentUser('sub') userId: string) {
 *   return this.service.findByUserId(userId);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    return data ? user?.[data] : user;
  },
);
