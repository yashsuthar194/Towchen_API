import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ResponseDto } from '../dto/response.dto';
import { LogService } from 'src/modules/log/log.service';
import { JwtService } from 'src/services/jwt/jwt.service';
import { NO_LOG_KEY } from 'src/modules/log/decorators/no-log.decorator';

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

  constructor(
    private readonly logService: LogService,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Check for @NoLog() decorator
    // ArgumentsHost can be cast to ExecutionContext in HTTP context to get handler/class
    const context = host as unknown as ExecutionContext;
    const targets: any[] = [];
    if (typeof context.getHandler === 'function' && context.getHandler()) {
      targets.push(context.getHandler());
    }
    if (typeof context.getClass === 'function' && context.getClass()) {
      targets.push(context.getClass());
    }
    
    const noLog =
      targets.length > 0
        ? this.reflector.getAllAndOverride<boolean>(NO_LOG_KEY, targets)
        : false;

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

    // Skip logging if @NoLog() is present
    if (noLog) {
      return;
    }

    // Fire-and-forget log — runs AFTER the response is sent so it cannot
    // delay or affect the client.
    setImmediate(() => {
      try {
        const startTime: number | undefined = (request as any)['_log_start'];
        const resTime = startTime ? Date.now() - startTime : 0;
        const { raw_token, decoded_token } = this._extractTokenInfo(request);

        this.logService.saveLog({
          // Request
          url: request.path ?? '/',
          method: request.method as any,
          req_body: this.logService.safeJson((request as any)?.body || null),
          req_query_params: request.query ?? null,
          req_header: this.logService.sanitizeHeaders(request.headers),
          req_files: this.logService.extractFileMetadata((request as any).files),
          req_content_type: request.headers?.['content-type']?.split(';')[0]?.trim(),

          // Response
          success: false,
          status_code: status,
          res_time: resTime,
          res_message: message,
          res_body: this.logService.safeJson(errorResponse),

          // Error
          error: message,
          error_stack: exception instanceof Error
            ? exception.stack ?? undefined
            : undefined,

          // Auth / User
          raw_token,
          decoded_token,
          user_role: decoded_token ? (decoded_token as any)?.type : undefined,
          user_id: decoded_token ? (decoded_token as any)?.id : undefined,

          // Client
          user_agent: request.headers?.['user-agent'] ?? undefined,
          ip_address: this.logService.extractIp(request as any),

          // Grouping / Debug
          endpoint_group: this.logService.deriveEndpointGroup(request.path),
          meta_data: (request as any)['_log_meta'] ?? null,
        });
      } catch (logErr) {
        // Safety net: logging errors must NEVER surface back to the client
        this.logger.error(
          '[HttpExceptionFilter] Failed to dispatch log entry',
          logErr instanceof Error ? logErr.stack : String(logErr),
        );
      }
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Safely decode JWT without throwing.
   * Returns nulls on any failure (missing header, invalid token, etc.).
   */
  private _extractTokenInfo(request: Request): {
    raw_token: string | undefined;
    decoded_token: unknown;
  } {
    try {
      const authHeader = request.headers?.authorization;
      if (!authHeader || typeof authHeader !== 'string') {
        return { raw_token: undefined, decoded_token: null };
      }
      const [scheme, token] = authHeader.split(' ');
      if (scheme !== 'Bearer' || !token) {
        return { raw_token: undefined, decoded_token: null };
      }
      const decoded = this.jwtService.decode(token);
      return { raw_token: token, decoded_token: decoded ?? null };
    } catch {
      return { raw_token: undefined, decoded_token: null };
    }
  }
}
