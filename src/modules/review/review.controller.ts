import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ReviewListResponseDto, ReviewItemDto, ReviewStatusDto } from './dto/review-response.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ResponseDto } from 'src/core/response/dto/response.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Review — Submit & Status
// ─────────────────────────────────────────────────────────────────────────────

@ApiTags('Review')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReviewController {
  constructor(private readonly _reviewService: ReviewService) {}

  /**
   * Submit a review for a completed order.
   *
   * The reviewer (customer or driver) is determined from the JWT token.
   * The reviewee is automatically derived from the order:
   * - Customer → reviews the assigned Driver
   * - Driver → reviews the Customer who placed the order
   *
   * Only one review per reviewer per order is allowed.
   */
  @Post('reviews')
  @ApiOperation({
    summary: 'Submit a review for a completed order',
    description:
      'Creates a review for a completed or closed order.\\n\\n' +
      '**Reviewer** is determined from the authenticated JWT user — never from the request body.\\n\\n' +
      '**Reviewee** is automatically derived from the order:\\n' +
      '- Customer → reviews the assigned Driver\\n' +
      '- Driver → reviews the Customer who placed the order\\n\\n' +
      'Constraints:\\n' +
      '- Order must be in `Completed` or `Closed` status\\n' +
      '- Only one review per reviewer per order\\n' +
      '- Rating must be between 1 and 5\\n' +
      '- Tags must be from the allowed set for the reviewer type',
  })
  @ApiResponseDto(ReviewItemDto, false, 201)
  async create(@Body() dto: CreateReviewDto): Promise<ResponseDto<ReviewItemDto>> {
    const review = await this._reviewService.createReviewAsync(dto);
    return ResponseDto.created('Review submitted successfully', review);
  }

  /**
   * Get review status for a specific order.
   *
   * Returns whether the customer and driver have submitted reviews.
   */
  @Get('orders/:id/review-status')
  @ApiOperation({
    summary: 'Get review status for an order',
    description:
      'Returns whether the customer and driver have submitted their reviews for a specific order.',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the order', example: 1 })
  @ApiResponseDto(ReviewStatusDto, false, 200)
  async getReviewStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<ReviewStatusDto>> {
    const status = await this._reviewService.getReviewStatusAsync(id);
    return ResponseDto.retrieved('Review status fetched successfully', status);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Review — Public Review Listings (Driver & Customer)
// ─────────────────────────────────────────────────────────────────────────────

@ApiTags('Review')
@Controller()
export class ReviewListController {
  constructor(private readonly _reviewService: ReviewService) {}

  /**
   * Get paginated reviews received by a driver.
   *
   * Returns averageRating, totalReviews, ratingBreakdown (1-5),
   * and a paginated list of individual reviews.
   */
  @Get('drivers/:id/reviews')
  @ApiOperation({
    summary: 'Get reviews for a driver',
    description:
      'Returns paginated reviews received by a specific driver.\\n\\n' +
      'Includes:\\n' +
      '- `averageRating` — cached average (not recalculated per request)\\n' +
      '- `totalReviews` — total review count\\n' +
      '- `ratingBreakdown` — count of reviews per star rating (1-5)\\n' +
      '- `reviews` — paginated list of individual reviews\\n' +
      '- `pagination` — page, page_size, total, total_pages',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the driver', example: 1 })
  @ApiResponseDto(ReviewListResponseDto, false, 200)
  async getDriverReviews(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ReviewQueryDto,
  ): Promise<ResponseDto<ReviewListResponseDto>> {
    const result = await this._reviewService.getDriverReviewsAsync(id, query);
    return ResponseDto.retrieved('Driver reviews fetched successfully', result);
  }

  /**
   * Get paginated reviews received by a customer.
   *
   * Returns averageRating, totalReviews, ratingBreakdown (1-5),
   * and a paginated list of individual reviews.
   */
  @Get('customers/:id/reviews')
  @ApiOperation({
    summary: 'Get reviews for a customer',
    description:
      'Returns paginated reviews received by a specific customer.\\n\\n' +
      'Includes:\\n' +
      '- `averageRating` — cached average (not recalculated per request)\\n' +
      '- `totalReviews` — total review count\\n' +
      '- `ratingBreakdown` — count of reviews per star rating (1-5)\\n' +
      '- `reviews` — paginated list of individual reviews\\n' +
      '- `pagination` — page, page_size, total, total_pages',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the customer', example: 1 })
  @ApiResponseDto(ReviewListResponseDto, false, 200)
  async getCustomerReviews(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ReviewQueryDto,
  ): Promise<ResponseDto<ReviewListResponseDto>> {
    const result = await this._reviewService.getCustomerReviewsAsync(id, query);
    return ResponseDto.retrieved('Customer reviews fetched successfully', result);
  }
}
