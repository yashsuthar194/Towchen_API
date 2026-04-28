import { SetMetadata } from '@nestjs/common';

/**
 * Key used for the NoLog metadata.
 */
export const NO_LOG_KEY = 'no_log';

/**
 * Decorator to disable API logging for a specific handler or controller.
 *
 * When applied, the `LoggingInterceptor` and `HttpExceptionFilter` will
 * skip persisting logs for the decorated endpoint.
 *
 * @example
 * ```typescript
 * @NoLog()
 * @Get('status')
 * getStatus() { ... }
 * ```
 */
export const NoLog = () => SetMetadata(NO_LOG_KEY, true);
