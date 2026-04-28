import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard wrapper for list response data
 */
export class PaginatedListDto<T> {
  @ApiProperty({
    description: 'Total number of records matching the filter',
    example: 10,
  })
  total_count: number;

  @ApiProperty({
    description: 'Array of records',
    isArray: true,
  })
  list: T[];

  constructor(totalCount: number, list: T[]) {
    this.total_count = totalCount;
    this.list = list;
  }
}
