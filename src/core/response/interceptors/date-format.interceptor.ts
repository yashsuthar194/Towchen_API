import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DateHelper } from '../../../shared/helper/date-helper';

/**
 * Global Interceptor to format all Date objects in the response.
 * Recursively traverses the response data and formats any Date instances
 * or ISO date strings into the requested format: "Jun 28 2025, 10:04 AM"
 */
@Injectable()
export class DateFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.formatDates(data)),
    );
  }

  /**
   * Recursively traverses data to find and format dates
   */
  private formatDates(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    // 1. If it's already a Date object
    if (data instanceof Date) {
      return this.doFormat(data);
    }

    // 2. If it's an array, process each item
    if (Array.isArray(data)) {
      return data.map((item) => this.formatDates(item));
    }

    // 3. If it's an object, process each property
    if (typeof data === 'object') {
      const formattedData = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          formattedData[key] = this.formatDates(data[key]);
        }
      }
      return formattedData;
    }

    // 4. If it's a string, check if it matches ISO date format
    if (typeof data === 'string' && data.length >= 20) {
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      if (isoDateRegex.test(data)) {
        const date = new Date(data);
        if (!isNaN(date.getTime())) {
          return this.doFormat(date);
        }
      }
    }

    return data;
  }

  /**
   * Actual formatting logic with heuristic for date vs datetime
   */
  private doFormat(date: Date): string {
    // Heuristic: If hours, minutes, and seconds are all 0, treat as date-only
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
    return DateHelper.format(date, hasTime);
  }
}
