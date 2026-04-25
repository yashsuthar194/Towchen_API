import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { HttpMethod, Role } from '@prisma/client';

/**
 * Query-string filters for GET /logs
 *
 * All filters are optional — omitting them returns all logs.
 * Combined filters act as AND conditions.
 */
export class LogFilterDto {
  // ── Pagination ────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Records per page (max 100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number = 20;

  // ── Outcome filters ───────────────────────────────────────────────────────

  @ApiPropertyOptional({ example: true, description: 'Filter by success/failure' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional({ example: 404, description: 'Filter by HTTP status code' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status_code?: number;

  // ── Routing filters ───────────────────────────────────────────────────────

  @ApiPropertyOptional({
    enum: HttpMethod,
    example: 'GET',
    description: 'Filter by HTTP method',
  })
  @IsOptional()
  @IsEnum(HttpMethod)
  method?: HttpMethod;

  @ApiPropertyOptional({
    example: 'vendor',
    description: 'Filter by endpoint group (first URL segment)',
  })
  @IsOptional()
  @IsString()
  endpoint_group?: string;

  // ── User / Role filters ───────────────────────────────────────────────────

  @ApiPropertyOptional({ enum: Role, example: 'Driver', description: 'Filter by user role' })
  @IsOptional()
  @IsEnum(Role)
  user_role?: Role;

  @ApiPropertyOptional({ example: 42, description: 'Filter by user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  user_id?: number;

  // ── Date range filters ────────────────────────────────────────────────────

  @ApiPropertyOptional({
    example: '2026-04-01',
    description: 'Return logs on or after this date (ISO 8601)',
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiPropertyOptional({
    example: '2026-04-30',
    description: 'Return logs on or before this date (ISO 8601)',
  })
  @IsOptional()
  @IsString()
  date_to?: string;

  // ── Response-time filter ──────────────────────────────────────────────────

  @ApiPropertyOptional({
    example: 500,
    description: 'Return logs where response time is greater than this value (ms)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_res_time?: number;

  // ── Search ────────────────────────────────────────────────────────────────

  @ApiPropertyOptional({
    example: '/driver/profile',
    description: 'Partial URL match (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    example: '192.168',
    description: 'Partial IP address match',
  })
  @IsOptional()
  @IsString()
  ip_address?: string;
}
