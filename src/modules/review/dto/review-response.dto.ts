import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewUserType } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Single Review Item
// ─────────────────────────────────────────────────────────────────────────────

export class ReviewItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ enum: ReviewUserType, example: 'Customer' })
  reviewerType: ReviewUserType;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  rating: number;

  @ApiPropertyOptional({ example: 'Excellent Service' })
  title?: string | null;

  @ApiPropertyOptional({ example: 'Driver arrived quickly and handled the vehicle professionally.' })
  comment?: string | null;

  @ApiPropertyOptional({ example: ['Professional', 'Friendly'] })
  tags?: string[] | null;

  @ApiProperty({ example: false })
  is_anonymous: boolean;

  @ApiProperty()
  created_at: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rating Breakdown
// ─────────────────────────────────────────────────────────────────────────────

export class RatingBreakdownDto {
  @ApiProperty({ example: 10, description: 'Number of 5-star reviews' })
  5: number;

  @ApiProperty({ example: 5, description: 'Number of 4-star reviews' })
  4: number;

  @ApiProperty({ example: 2, description: 'Number of 3-star reviews' })
  3: number;

  @ApiProperty({ example: 1, description: 'Number of 2-star reviews' })
  2: number;

  @ApiProperty({ example: 0, description: 'Number of 1-star reviews' })
  1: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination Meta
// ─────────────────────────────────────────────────────────────────────────────

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  page_size: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  total_pages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Paginated Review List Response
// ─────────────────────────────────────────────────────────────────────────────

export class ReviewListResponseDto {
  @ApiProperty({ example: 4.5 })
  averageRating: number;

  @ApiProperty({ example: 18 })
  totalReviews: number;

  @ApiProperty({ type: RatingBreakdownDto })
  ratingBreakdown: RatingBreakdownDto;

  @ApiProperty({ type: [ReviewItemDto] })
  reviews: ReviewItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}

// ─────────────────────────────────────────────────────────────────────────────
// Review Status (per order)
// ─────────────────────────────────────────────────────────────────────────────

export class ReviewStatusDto {
  @ApiProperty({ example: true, description: 'Whether the customer has submitted a review' })
  customerReviewed: boolean;

  @ApiProperty({ example: false, description: 'Whether the driver has submitted a review' })
  driverReviewed: boolean;
}
