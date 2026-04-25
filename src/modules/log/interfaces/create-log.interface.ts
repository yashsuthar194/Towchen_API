import { HttpMethod, Role } from '@prisma/client';

/**
 * Internal interface used to pass log data to LogService.saveLog().
 *
 * All fields except the required request identifiers are optional so
 * callers only need to supply what they have available at log time.
 */
export interface CreateLogInput {
  // ── Request ────────────────────────────────────────────────────────────────
  url: string;
  method: HttpMethod;
  req_body?: unknown;
  req_query_params?: unknown;
  req_header?: unknown;
  req_files?: unknown; // multipart file metadata array
  req_content_type?: string;

  // ── Response ───────────────────────────────────────────────────────────────
  success: boolean;
  status_code: number;
  res_time: number; // milliseconds
  res_message?: string;
  res_body?: unknown;

  // ── Error ──────────────────────────────────────────────────────────────────
  error?: string;
  error_stack?: string;

  // ── Auth / User ────────────────────────────────────────────────────────────
  raw_token?: string;
  decoded_token?: unknown;
  user_role?: Role;
  user_id?: number;
  user_formated_id?: string;

  // ── Client ─────────────────────────────────────────────────────────────────
  user_agent?: string;
  ip_address?: string;

  // ── Grouping / Debug ───────────────────────────────────────────────────────
  endpoint_group?: string;
  meta_data?: unknown;
}
