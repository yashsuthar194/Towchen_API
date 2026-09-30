import { ApiProperty } from '@nestjs/swagger';

export class DealerResponseDto {
  @ApiProperty({ example: 1, description: 'Unique identifier' })
  id: number;

  @ApiProperty({ example: 'DLR0000001', description: 'Formatted dealer ID' })
  formated_id: string;

  @ApiProperty({ example: 'dealer@example.com', description: 'Dealer email' })
  email: string;

  @ApiProperty({ example: '2026-09-30T12:00:00.000Z', description: 'Created timestamp' })
  created_at: Date;

  @ApiProperty({ example: '2026-09-30T12:00:00.000Z', description: 'Updated timestamp' })
  updated_at: Date;
}

export class DealerPaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Items per page limit' })
  limit: number;

  @ApiProperty({ example: 25, description: 'Total records count' })
  total: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  total_pages: number;
}

export class DealerListResponseDto {
  @ApiProperty({ type: [DealerResponseDto], description: 'List of dealers' })
  items: DealerResponseDto[];

  @ApiProperty({ type: DealerPaginationMetaDto, description: 'Pagination metadata' })
  pagination: DealerPaginationMetaDto;
}
