import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { DateFormatInterceptor } from './interceptors/date-format.interceptor';

/**
 * Response Module
 *
 * Registers the global HTTP exception filter that automatically wraps
 * all thrown exceptions into the standardized ResponseDto format.
 *
 * Usage:
 * 1. Import this module in AppModule
 * 2. Controllers return ResponseDto manually for success
 * 3. Throw exceptions anywhere - they're automatically formatted
 *
 * @example
 * // In AppModule:
 * @Module({
 *   imports: [ResponseModule, ...],
 * })
 * export class AppModule {}
 */
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DateFormatInterceptor,
    },
  ],
})
export class ResponseModule {}
