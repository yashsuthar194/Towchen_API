import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { LogService } from './log.service';
import { LogFilterDto } from './dto/log-filter.dto';
import { LogDto } from './dto/log.dto';
import { NoLog } from './decorators/no-log.decorator';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { PaginatedListDto } from 'src/core/response/dto/paginated-list.dto';
import {
  ApiResponseDto,
} from 'src/core/response/decorators/api-response-dto.decorator';

/**
 * Public API for browsing API call logs.
 *
 * These endpoints are intentionally open (no auth guard) so that a
 * separate web dashboard can consume them without needing credentials.
 *
 * Endpoints:
 *  GET /logs        — paginated + filtered list
 *  GET /logs/:id    — single log entry by ID
 */
@ApiTags('Logs')
@NoLog()
@Controller('logs')
export class LogController {
  constructor(private readonly _logService: LogService) {}

  /**
   * Retrieve a paginated, filterable list of API call logs.
   *
   * All query parameters are optional. When no filters are supplied,
   * results are sorted by date descending (newest first).
   *
   * **Available filters:**
   * | Parameter       | Type    | Description                                  |
   * |----------------|---------|----------------------------------------------|
   * | `page`          | number  | Page number (1-based, default: 1)            |
   * | `page_size`     | number  | Records per page (max 100, default: 20)      |
   * | `success`       | boolean | true = only success, false = only errors     |
   * | `status_code`   | number  | Exact HTTP status code (e.g. 404)            |
   * | `method`        | enum    | GET, POST, PUT, DELETE, PATCH…               |
   * | `endpoint_group`| string  | First URL segment (e.g. "driver", "vendor")  |
   * | `user_role`     | enum    | Role enum value (Driver, Vendor, Customer…)  |
   * | `user_id`       | number  | Exact user ID                                |
   * | `date_from`     | string  | ISO 8601 date — inclusive start              |
   * | `date_to`       | string  | ISO 8601 date — inclusive end (end of day)   |
   * | `min_res_time`  | number  | Minimum response time in ms                  |
   * | `url`           | string  | Partial case-insensitive URL match           |
   * | `ip_address`    | string  | Partial case-insensitive IP match            |
   *
   * @returns Paginated list with total_count and list array
   */
  @Get()
  @ApiOperation({
    summary: 'List API call logs',
    description:
      'Returns a paginated list of API call logs. All query parameters are optional.',
  })
  @ApiResponseDto(LogDto, true, 200)
  async getListAsync(
    @Query() filter: LogFilterDto,
  ): Promise<ResponseDto<PaginatedListDto<LogDto>>> {
    const result = await this._logService.getList(filter);
    return ResponseDto.retrieved('Logs retrieved successfully', result);
  }

  /**
   * Retrieve a single log entry by its unique ID.
   *
   * @param id - The log entry's numeric primary key
   * @returns Full log record including request body, response body,
   *          decoded token, error stack, and meta_data
   * @throws {NotFoundException} If no log exists with the given ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get log entry by ID',
    description: 'Returns the full details of a single API call log entry.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Log entry ID' })
  @ApiResponseDto(LogDto, false, 200)
  async getByIdAsync(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<LogDto>> {
    const log = await this._logService.getById(id);
    return ResponseDto.retrieved('Log entry retrieved successfully', log);
  }
}
