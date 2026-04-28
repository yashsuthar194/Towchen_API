import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HttpMethod, Role } from '@prisma/client';

/**
 * Shape of a single log entry returned by the API.
 * Matches the Prisma `logs` model exactly.
 */
export class LogDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Apr 25 2026, 12:00 PM' })
  date: string;

  @ApiProperty({ example: 1745580000 })
  time_stamp: number;

  @ApiProperty({ example: '/vendor/profile/1' })
  url: string;

  @ApiProperty({ enum: HttpMethod, example: 'GET' })
  method: HttpMethod;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  status_code: number;

  @ApiProperty({ example: 123, description: 'Response time in milliseconds' })
  res_time: number;

  @ApiPropertyOptional({ example: 'Profile retrieved successfully' })
  res_message: string | null;

  @ApiPropertyOptional({ example: null, description: 'Error message (null on success)' })
  error: string | null;

  @ApiPropertyOptional({ description: 'Full stack trace (only on 500 errors)' })
  error_stack: string | null;

  @ApiPropertyOptional({ description: 'Parsed request body' })
  req_body: unknown;

  @ApiPropertyOptional({ description: 'Query parameters' })
  req_query_params: unknown;

  @ApiPropertyOptional({ description: 'Request headers (authorization excluded)' })
  req_header: unknown;

  @ApiPropertyOptional({ description: 'Multipart file metadata (no binary)' })
  req_files: unknown;

  @ApiPropertyOptional({ example: 'application/json' })
  req_content_type: string | null;

  @ApiPropertyOptional({ description: 'Full response body' })
  res_body: unknown;

  @ApiPropertyOptional({ description: 'Raw Bearer token' })
  raw_token: string | null;

  @ApiPropertyOptional({ description: 'Decoded JWT payload' })
  decoded_token: unknown;

  @ApiPropertyOptional({ enum: Role, example: 'Vendor' })
  user_role: Role | null;

  @ApiPropertyOptional({ example: 5 })
  user_id: number | null;

  @ApiPropertyOptional({ example: 'VND-00005' })
  user_formated_id: string | null;

  @ApiPropertyOptional({ example: 'Mozilla/5.0' })
  user_agent: string | null;

  @ApiPropertyOptional({ example: '103.21.244.0' })
  ip_address: string | null;

  @ApiPropertyOptional({ example: 'vendor', description: 'Auto-derived URL segment group' })
  endpoint_group: string | null;

  @ApiPropertyOptional({ description: 'Debug data set by business services via CallerService.setMeta()' })
  meta_data: unknown;
}
