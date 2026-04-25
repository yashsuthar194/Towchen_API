import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { DateFormatInterceptor } from './interceptors/date-format.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { LogModule } from 'src/modules/log/log.module';
import { JwtModule } from 'src/services/jwt/jwt.module';
import { LogService } from 'src/modules/log/log.service';
import { JwtService } from 'src/services/jwt/jwt.service';

/**
 * Response Module
 *
 * Registers global providers in this order:
 *  1. HttpExceptionFilter  — catches ALL exceptions, formats them as ResponseDto,
 *                            and fires a fire-and-forget error log entry.
 *  2. DateFormatInterceptor — transforms Date objects in responses to readable strings.
 *  3. LoggingInterceptor    — logs every successful response (fire-and-forget).
 *
 * Interceptor execution order (outermost → innermost):
 *   LoggingInterceptor → DateFormatInterceptor → Controller
 * Response flows back in reverse, so LoggingInterceptor.tap() sees the
 * already date-formatted response body — exactly what the client receives.
 */
@Module({
  imports: [LogModule, JwtModule],
  providers: [
    // ── Exception Filter ───────────────────────────────────────────────────
    // useFactory so NestJS can inject LogService + JwtService from imported modules.
    {
      provide: APP_FILTER,
      useFactory: (logService: LogService, jwtService: JwtService, reflector: Reflector) =>
        new HttpExceptionFilter(logService, jwtService, reflector),
      inject: [LogService, JwtService, Reflector],
    },

    // ── Interceptors (registered in execution order) ────────────────────────
    // DateFormatInterceptor runs first (innermost) — transforms dates in response.
    {
      provide: APP_INTERCEPTOR,
      useClass: DateFormatInterceptor,
    },
    // LoggingInterceptor runs second (outermost) — logs the final response body.
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class ResponseModule {}
