import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ResponseDto } from '../dto/response.dto';

/**
 * Global exception filter that automatically wraps all errors in ResponseDto
 *
 * This filter catches ALL exceptions thrown in the application and formats them
 * into the standard ResponseDto structure with is_success: false
 *
 * Developers don't need to worry about error formatting - just throw exceptions!
 *
 * @example
 * // In your service:
 * throw new NotFoundException('Vendor not found');
 *
 * // Automatically becomes:
 * {
 *   is_success: false,
 *   status: 404,
 *   status_message: "NOT_FOUND",
 *   message: "Vendor not found",
 *   data: null
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let data: any = null;

    // Handle NestJS HttpException (most common)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const errorResponse = exceptionResponse as any;

        // Handle validation errors from class-validator
        // These come as an array of error messages
        if (Array.isArray(errorResponse.message)) {
          message = 'Validation failed';
          data = {
            errors: errorResponse.message,
          };
        } else {
          message = errorResponse.message || exception.message;

          // Include additional error details if present
          if (errorResponse.error) {
            data = { error: errorResponse.error };
          }
        }
      } else {
        // Simple string message
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma Known errors (Constraint violations, etc.)
      switch (exception.code) {
        case 'P2002': // Unique constraint
          status = HttpStatus.CONFLICT;
          message = `Duplicate entry: A record with this ${exception.meta?.target} already exists.`;
          break;
        case 'P2025': // Not found
          status = HttpStatus.NOT_FOUND;
          message = (exception.meta?.cause as string) || 'Record not found';
          break;
        case 'P2003': // Foreign key constraint
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed: Related record not found.';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Database error: ${exception.message}`;
      }
      this.logger.error(`Prisma Known Error (${exception.code}): ${message}`);
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      // Handle Prisma Validation errors (e.g., invalid enum value or type mismatch)
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided to the database. Please check your input fields.';
      this.logger.error(`Prisma Validation Error: ${exception.message}`);
    } else if (exception instanceof Error) {
      // Handle standard JavaScript errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';

      // Log full error details for debugging
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );

      // In development mode, include error details for easier debugging
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (isDevelopment) {
        data = {
          error: exception.message,
          // Include first 5 lines of stack trace
          stack: exception.stack?.split('\n').slice(0, 5),
        };
      }
    } else {
      // Handle completely unknown errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      this.logger.error(`Unknown exception type: ${exception}`);
    }

    // Log error with request context for monitoring
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - ${message}`,
    );

    // Create and send standardized error response
    const errorResponse = ResponseDto.error(message, status, data);

    response.status(status).json(errorResponse);
  }
}
