import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpMethod, Prisma, Role } from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateLogInput } from './interfaces/create-log.interface';
import { LogFilterDto } from './dto/log-filter.dto';
import { PaginatedListDto } from 'src/core/response/dto/paginated-list.dto';

/**
 * Handles fire-and-forget API call logging.
 *
 * Design principles:
 * - `saveLog()` NEVER throws and NEVER awaits — it is completely detached
 *   from the request/response cycle.
 * - Failed DB writes are retried up to MAX_RETRIES times with exponential
 *   back-off before being written to stderr.
 * - All data is sanitised before persistence (circular refs, BigInt, etc.)
 */
@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);
  private readonly MAX_RETRIES = 3;

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Persist an API call log entry asynchronously.
   *
   * This method is intentionally fire-and-forget:
   * - It never throws.
   * - It never blocks the caller.
   * - Retries are handled internally with exponential back-off.
   */
  saveLog(input: CreateLogInput): void {
    // Defer to next event-loop tick so the HTTP response is sent first.
    setImmediate(() => this._persist(input, 1));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Query API (used by LogController)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Fetch a paginated, filtered list of log entries.
   * All filters are optional — omit them to return all logs.
   */
  async getList(filter: LogFilterDto): Promise<PaginatedListDto<any>> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.page_size ?? 20));
    const skip = (page - 1) * pageSize;

    const where = this._buildWhere(filter);

    const [total_count, list] = await Promise.all([
      this.prisma.logs.count({ where }),
      this.prisma.logs.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return new PaginatedListDto(total_count, list);
  }

  /**
   * Fetch a single log entry by its primary-key ID.
   * @throws {NotFoundException} If no log exists with the given ID
   */
  async getById(id: number): Promise<any> {
    const log = await this.prisma.logs.findUnique({ where: { id } });

    if (!log) {
      throw new NotFoundException(`Log entry with id ${id} not found`);
    }

    return log;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers used by LoggingInterceptor / HttpExceptionFilter
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Safely extract the client's real IP address.
   * Respects X-Forwarded-For (reverse-proxy environments like Render/Nginx).
   */
  extractIp(req: Record<string, any>): string | undefined {
    try {
      const forwarded = req?.headers?.['x-forwarded-for'];
      if (forwarded) {
        // X-Forwarded-For may be a comma-separated list; first is the client
        return String(forwarded).split(',')[0]?.trim();
      }
      return req?.socket?.remoteAddress ?? req?.ip ?? undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Safely extract multipart file metadata from req.files.
   * Supports both array form and field-keyed object form (multer).
   * NEVER returns binary data.
   */
  extractFileMetadata(files: unknown): Array<Record<string, unknown>> | null {
    if (!files) return null;

    try {
      const toMeta = (f: any) => ({
        fieldname: f?.fieldname ?? null,
        originalname: f?.originalname ?? null,
        mimetype: f?.mimetype ?? null,
        size: f?.size ?? null,
        encoding: f?.encoding ?? null,
      });

      if (Array.isArray(files)) {
        return files.map(toMeta);
      }

      // multer fields() returns { fieldname: File[] }
      if (typeof files === 'object' && files !== null) {
        return Object.values(files as Record<string, any[]>)
          .flat()
          .map(toMeta);
      }
    } catch {
      // Never let file extraction crash the logger
    }

    return null;
  }

  /**
   * Derive a short endpoint group label from the request URL.
   * e.g. "/driver/profile/123?foo=bar" → "driver"
   *
   * @param reflectorValue - Value from @SetMetadata('endpoint_group', '...') if set
   */
  deriveEndpointGroup(url: string, reflectorValue?: string): string {
    if (reflectorValue) return reflectorValue;
    try {
      const pathname = url?.split('?')[0] ?? '';
      const segment = pathname.replace(/^\//, '').split('/')[0];
      return segment || 'root';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Safely serialise any value for JSON storage.
   * Handles: circular references, BigInt, undefined, functions, errors.
   */
  safeJson(data: unknown): unknown {
    if (data === null || data === undefined) return null;
    if (typeof data === 'string') return data;
    if (typeof data === 'number' || typeof data === 'boolean') return data;

    try {
      const seen = new WeakSet<object>();
      return JSON.parse(
        JSON.stringify(data, (_key, value) => {
          if (typeof value === 'bigint') return value.toString();
          if (typeof value === 'function') return '[Function]';
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular]';
            seen.add(value);
          }
          return value;
        }),
      );
    } catch {
      return { _error: 'Serialization failed', _type: typeof data };
    }
  }

  /**
   * Strip the Authorization header from a headers object to avoid
   * storing the raw token twice (it's captured in raw_token separately).
   */
  sanitizeHeaders(headers: unknown): Record<string, unknown> | null {
    if (!headers || typeof headers !== 'object') return null;
    try {
      const { authorization, Authorization, ...rest } = headers as Record<string, unknown>;
      void authorization;
      void Authorization;
      return this.safeJson(rest) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Private — retry logic
  // ──────────────────────────────────────────────────────────────────────────

  private async _persist(input: CreateLogInput, attempt: number): Promise<void> {
    try {
      await this.prisma.logs.create({
        data: {
          // Timestamps
          time_stamp: Math.floor(Date.now() / 1000),

          // Request
          url: this._safeStr(input.url, 2048),
          method: this._safeMethod(input.method),
          req_body: this.safeJson(input.req_body) as any,
          req_query_params: this.safeJson(input.req_query_params) as any,
          req_header: this.safeJson(input.req_header) as any,
          req_files: this.safeJson(input.req_files) as any,
          req_content_type: input.req_content_type ?? null,

          // Response
          success: input.success ?? false,
          status_code: input.status_code ?? 0,
          res_time: input.res_time ?? 0,
          res_message: input.res_message ?? null,
          res_body: this.safeJson(input.res_body) as any,

          // Error
          error: input.error ?? null,
          error_stack: this._truncate(input.error_stack, 5000),

          // Auth / User
          raw_token: input.raw_token ?? null,
          decoded_token: this.safeJson(input.decoded_token) as any,
          user_role: input.user_role ?? null,
          user_id: input.user_id ?? null,
          user_formated_id: input.user_formated_id ?? null,

          // Client
          user_agent: input.user_agent ?? null,
          ip_address: input.ip_address ?? null,

          // Grouping / Debug
          endpoint_group: input.endpoint_group ?? null,
          meta_data: this.safeJson(input.meta_data) as any,
        },
      });

      if (attempt > 1) {
        this.logger.log(`Log saved on retry attempt ${attempt}`);
      }
    } catch (err: unknown) {
      this._handlePersistError(input, attempt, err);
    }
  }

  private _handlePersistError(
    input: CreateLogInput,
    attempt: number,
    err: unknown,
  ): void {
    const message = err instanceof Error ? err.message : String(err);

    if (attempt < this.MAX_RETRIES) {
      // Exponential back-off: 1 s, 2 s, 4 s
      const delay = Math.pow(2, attempt - 1) * 1000;

      this.logger.warn(
        `[LogService] Retry ${attempt}/${this.MAX_RETRIES} in ${delay}ms — ${message}`,
      );

      setTimeout(() => this._persist(input, attempt + 1), delay);
    } else {
      // All retries exhausted — write a compact summary so nothing is silently lost
      this.logger.error(
        `[LogService] All ${this.MAX_RETRIES} retries exhausted. Dropping log entry.`,
        {
          error: message,
          url: input.url,
          method: input.method,
          status_code: input.status_code,
          timestamp: new Date().toISOString(),
        },
      );
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // String utilities
  // ──────────────────────────────────────────────────────────────────────────

  private _safeStr(value: unknown, maxLen = 512): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return str.length > maxLen ? str.slice(0, maxLen) : str;
  }

  private _truncate(value: unknown, maxLen: number): string | null {
    if (value === null || value === undefined) return null;
    const str = String(value);
    return str.length > maxLen ? str.slice(0, maxLen) + '…[truncated]' : str;
  }

  private _safeMethod(method: unknown): HttpMethod {
    const VALID: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
    return VALID.includes(method as HttpMethod)
      ? (method as HttpMethod)
      : 'GET'; // fallback — should never happen
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Prisma where builder
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Builds a Prisma `where` clause from the supplied filter DTO.
   * All conditions are AND-combined (default Prisma behavior).
   * Invalid / missing values are gracefully skipped.
   */
  private _buildWhere(filter: LogFilterDto): Prisma.logsWhereInput {
    const where: Prisma.logsWhereInput = {};

    // Outcome
    if (filter.success !== undefined && filter.success !== null) {
      where.success = filter.success;
    }
    if (filter.status_code !== undefined) {
      where.status_code = filter.status_code;
    }

    // HTTP method
    if (filter.method) {
      where.method = filter.method;
    }

    // Endpoint group — exact match
    if (filter.endpoint_group?.trim()) {
      where.endpoint_group = filter.endpoint_group.trim();
    }

    // User
    if (filter.user_role) {
      where.user_role = filter.user_role;
    }
    if (filter.user_id !== undefined) {
      where.user_id = filter.user_id;
    }

    // Date range — parse safely so bad strings don't crash the query
    const parsedFrom = filter.date_from ? new Date(filter.date_from) : null;
    const parsedTo = filter.date_to ? new Date(filter.date_to) : null;

    if (parsedFrom && !isNaN(parsedFrom.getTime())) {
      where.date = { ...(where.date as object), gte: parsedFrom };
    }
    if (parsedTo && !isNaN(parsedTo.getTime())) {
      // Include the entire end day by moving to end-of-day
      parsedTo.setHours(23, 59, 59, 999);
      where.date = { ...(where.date as object), lte: parsedTo };
    }

    // Minimum response time
    if (filter.min_res_time !== undefined && filter.min_res_time >= 0) {
      where.res_time = { gte: filter.min_res_time };
    }

    // Partial URL match (case-insensitive)
    if (filter.url?.trim()) {
      where.url = { contains: filter.url.trim(), mode: 'insensitive' };
    }

    // Partial IP address match (case-insensitive)
    if (filter.ip_address?.trim()) {
      where.ip_address = { contains: filter.ip_address.trim(), mode: 'insensitive' };
    }

    return where;
  }
}
