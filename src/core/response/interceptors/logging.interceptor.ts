import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { JwtService } from 'src/services/jwt/jwt.service';
import { LogService } from 'src/modules/log/log.service';
import { CreateLogInput } from 'src/modules/log/interfaces/create-log.interface';
import { NO_LOG_KEY } from 'src/modules/log/decorators/no-log.decorator';

/**
 * Global singleton interceptor that logs every successful HTTP response.
 *
 * Design notes:
 * - SINGLETON scope — no request-scoped injection needed because all shared
 *   request state (start time, meta_data) is stored directly on the Express
 *   Request object by CallerService.
 * - Logs ONLY successes (2xx). Errors are logged by HttpExceptionFilter.
 * - The DB write is deferred via setImmediate() so the client receives its
 *   response before any logging work starts.
 * - This interceptor NEVER throws — any internal error is swallowed and logged
 *   to stderr so it cannot affect the API.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(
    private readonly logService: LogService,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Guard: only handle HTTP contexts
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // Check for @NoLog() decorator on handler or controller
    const targets: any[] = [];
    if (typeof context.getHandler === 'function' && context.getHandler()) {
      targets.push(context.getHandler());
    }
    if (typeof context.getClass === 'function' && context.getClass()) {
      targets.push(context.getClass());
    }
    const noLog = targets.length > 0 ? this.reflector.getAllAndOverride<boolean>(NO_LOG_KEY, targets) : false;

    if (noLog) {
      return next.handle();
    }

    // Store start time on the request object so HttpExceptionFilter can also
    // compute res_time. CallerService may have already set this — don't overwrite.
    if (!(req as any)['_log_start']) {
      (req as any)['_log_start'] = Date.now();
    }

    const startTime: number = (req as any)['_log_start'];

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          // Defer DB write to next event-loop tick after response is flushed
          setImmediate(() => {
            try {
              const resTime = Date.now() - startTime;
              const logInput = this._buildLogInput(
                req,
                res,
                responseBody,
                resTime,
                context,
                true,
              );
              this.logService.saveLog(logInput);
            } catch (err) {
              // Safety net: interceptor errors must never surface to the client
              this.logger.error(
                '[LoggingInterceptor] Failed to build log input',
                err instanceof Error ? err.stack : String(err),
              );
            }
          });
        },
        // Error path is intentionally left empty.
        // HttpExceptionFilter handles error logging with the formatted
        // error message and status code which are only known there.
      }),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────────────────────

  private _buildLogInput(
    req: Request,
    res: Response,
    responseBody: unknown,
    resTime: number,
    context: ExecutionContext,
    success: boolean,
  ): CreateLogInput {
    const { raw_token, decoded_token } = this._extractTokenInfo(req);
    const endpointGroup = this._deriveEndpointGroup(req.path, context);

    return {
      // Request
      url: req.path ?? '/',
      method: req.method as any,
      req_body: this._extractBody(req),
      req_query_params: req.query ?? null,
      req_header: this.logService.sanitizeHeaders(req.headers),
      req_files: this.logService.extractFileMetadata((req as any).files),
      req_content_type: this._extractContentType(req),

      // Response
      success,
      status_code: res.statusCode ?? 200,
      res_time: resTime,
      res_message: this._extractResMessage(responseBody),
      res_body: this.logService.safeJson(responseBody),

      // Auth / User
      raw_token,
      decoded_token,
      user_role: decoded_token ? (decoded_token as any)?.type as Role : undefined,
      user_id: decoded_token ? (decoded_token as any)?.id as number : undefined,

      // Client
      user_agent: req.headers?.['user-agent'] ?? undefined,
      ip_address: this.logService.extractIp(req as any),

      // Grouping / Debug
      endpoint_group: endpointGroup,
      meta_data: (req as any)['_log_meta'] ?? null,
    };
  }

  /**
   * Extract and decode the JWT token without throwing.
   */
  private _extractTokenInfo(req: Request): {
    raw_token: string | undefined;
    decoded_token: unknown;
  } {
    try {
      const authHeader = req.headers?.authorization;
      if (!authHeader || typeof authHeader !== 'string') {
        return { raw_token: undefined, decoded_token: null };
      }

      const [scheme, token] = authHeader.split(' ');
      if (scheme !== 'Bearer' || !token) {
        return { raw_token: undefined, decoded_token: null };
      }

      // decode() does NOT verify — intentional, we want payload regardless
      const decoded = this.jwtService.decode(token);
      return { raw_token: token, decoded_token: decoded ?? null };
    } catch {
      return { raw_token: undefined, decoded_token: null };
    }
  }

  /**
   * Safely extract the request body.
   * Returns null for GET/HEAD (no body expected) and handles parse errors.
   */
  private _extractBody(req: Request): unknown {
    try {
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method?.toUpperCase())) {
        return null;
      }
      const body = (req as any).body;
      if (!body || Object.keys(body).length === 0) return null;
      return body;
    } catch {
      return null;
    }
  }

  /**
   * Safely extract Content-Type (without boundary/charset params).
   * e.g. "multipart/form-data; boundary=..." → "multipart/form-data"
   */
  private _extractContentType(req: Request): string | undefined {
    try {
      const ct = req.headers?.['content-type'];
      return ct ? ct.split(';')[0].trim() : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Pull the human-readable message from a ResponseDto response body.
   * Falls back to null gracefully.
   */
  private _extractResMessage(responseBody: unknown): string | undefined {
    try {
      if (responseBody && typeof responseBody === 'object') {
        const msg = (responseBody as any)?.message;
        return typeof msg === 'string' ? msg : undefined;
      }
    } catch {
      // ignore
    }
    return undefined;
  }

  /**
   * Derive the endpoint group from @SetMetadata or URL.
   */
  private _deriveEndpointGroup(
    url: string,
    context: ExecutionContext,
  ): string {
    try {
      const reflectorValue = this.reflector.get<string>(
        'endpoint_group',
        context.getHandler(),
      );
      return this.logService.deriveEndpointGroup(url, reflectorValue);
    } catch {
      return this.logService.deriveEndpointGroup(url);
    }
  }
}
