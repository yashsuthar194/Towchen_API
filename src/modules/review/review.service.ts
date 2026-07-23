import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CallerService } from 'src/services/jwt/caller.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewListResponseDto, ReviewItemDto, ReviewStatusDto } from './dto/review-response.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { OrderStatus, ReviewUserType } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Allowed Tags
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOMER_TO_DRIVER_TAGS = [
  'Professional',
  'Friendly',
  'On Time',
  'Safe Driving',
  'Helpful',
  'Good Communication',
  'Vehicle Handled Carefully',
];

const DRIVER_TO_CUSTOMER_TAGS = [
  'Respectful',
  'Good Communication',
  'Ready On Arrival',
  'Paid Promptly',
  'Accurate Pickup Location',
];

@Injectable()
export class ReviewService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _callerService: CallerService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // Submit Review
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Creates a review for a completed order.
   * Determines reviewer/reviewee from the authenticated user and order data.
   * Updates rating aggregation in a single transaction.
   */
  async createReviewAsync(dto: CreateReviewDto): Promise<ReviewItemDto> {
    const userId = this._callerService.getUserId();
    const userType = this._callerService.getUserType();

    // Determine reviewer type
    let reviewerType: ReviewUserType;
    if (this._callerService.isCustomer()) {
      reviewerType = ReviewUserType.Customer;
    } else if (this._callerService.isDriver()) {
      reviewerType = ReviewUserType.Driver;
    } else {
      throw new ForbiddenException('Only customers and drivers can submit reviews');
    }

    // Fetch order with relevant relations
    const order = await this._prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    // Validate order status
    if (order.status !== OrderStatus.Completed && order.status !== OrderStatus.Closed) {
      throw new BadRequestException('Reviews can only be submitted for completed or closed orders');
    }

    // Validate driver and customer are assigned
    if (!order.driver_id) {
      throw new BadRequestException('No driver assigned to this order');
    }

    if (!order.customer_id) {
      throw new BadRequestException('No customer assigned to this order');
    }

    // Determine reviewee based on reviewer type and validate ownership
    let revieweeType: ReviewUserType;
    let revieweeId: number;

    if (reviewerType === ReviewUserType.Customer) {
      // Customer reviews the driver
      if (order.customer_id !== userId) {
        throw new ForbiddenException('You are not the customer for this order');
      }
      revieweeType = ReviewUserType.Driver;
      revieweeId = order.driver_id;
    } else {
      // Driver reviews the customer
      if (order.driver_id !== userId) {
        throw new ForbiddenException('You are not the assigned driver for this order');
      }
      revieweeType = ReviewUserType.Customer;
      revieweeId = order.customer_id;
    }

    // Check for duplicate review
    const existingReview = await this._prisma.review.findUnique({
      where: {
        order_id_reviewer_type_reviewer_id: {
          order_id: dto.orderId,
          reviewer_type: reviewerType,
          reviewer_id: userId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already submitted a review for this order');
    }

    // Validate tags if provided
    if (dto.tags && dto.tags.length > 0) {
      const allowedTags = reviewerType === ReviewUserType.Customer
        ? CUSTOMER_TO_DRIVER_TAGS
        : DRIVER_TO_CUSTOMER_TAGS;

      const invalidTags = dto.tags.filter(tag => !allowedTags.includes(tag));
      if (invalidTags.length > 0) {
        throw new BadRequestException(`Invalid tags: ${invalidTags.join(', ')}`);
      }
    }

    // Create review and update rating aggregation in a single transaction
    const review = await this._prisma.$transaction(async (tx) => {
      // 1. Create the review
      const newReview = await tx.review.create({
        data: {
          order_id: dto.orderId,
          reviewer_type: reviewerType,
          reviewer_id: userId,
          reviewee_type: revieweeType,
          reviewee_id: revieweeId,
          rating: dto.rating,
          title: dto.title,
          comment: dto.comment,
          tags: dto.tags ?? undefined,
          is_anonymous: dto.is_anonymous ?? false,
        },
      });

      // 2. Update rating aggregation on the reviewee
      if (revieweeType === ReviewUserType.Driver) {
        const driver = await tx.driver.findUnique({
          where: { id: revieweeId },
          select: { average_rating: true, total_reviews: true },
        });

        if (driver) {
          const newTotal = driver.total_reviews + 1;
          const newAverage = parseFloat(
            ((driver.average_rating * driver.total_reviews + dto.rating) / newTotal).toFixed(2),
          );

          await tx.driver.update({
            where: { id: revieweeId },
            data: {
              average_rating: newAverage,
              total_reviews: newTotal,
            },
          });
        }
      } else {
        const customer = await tx.customer.findUnique({
          where: { id: revieweeId },
          select: { average_rating: true, total_reviews: true },
        });

        if (customer) {
          const newTotal = customer.total_reviews + 1;
          const newAverage = parseFloat(
            ((customer.average_rating * customer.total_reviews + dto.rating) / newTotal).toFixed(2),
          );

          await tx.customer.update({
            where: { id: revieweeId },
            data: {
              average_rating: newAverage,
              total_reviews: newTotal,
            },
          });
        }
      }

      return newReview;
    });

    // Map to response DTO
    return {
      id: review.id,
      reviewerType: review.reviewer_type,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      tags: review.tags as string[] | null,
      is_anonymous: review.is_anonymous,
      created_at: review.created_at,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Get Reviews for a Driver
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Returns paginated reviews received by a driver, along with
   * averageRating, totalReviews, and ratingBreakdown.
   */
  async getDriverReviewsAsync(driverId: number, query: ReviewQueryDto): Promise<ReviewListResponseDto> {
    // Verify driver exists
    const driver = await this._prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, average_rating: true, total_reviews: true },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    return this.getReviewsForEntityAsync(
      ReviewUserType.Driver,
      driverId,
      driver.average_rating,
      driver.total_reviews,
      query,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Get Reviews for a Customer
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Returns paginated reviews received by a customer, along with
   * averageRating, totalReviews, and ratingBreakdown.
   */
  async getCustomerReviewsAsync(customerId: number, query: ReviewQueryDto): Promise<ReviewListResponseDto> {
    // Verify customer exists
    const customer = await this._prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, average_rating: true, total_reviews: true },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return this.getReviewsForEntityAsync(
      ReviewUserType.Customer,
      customerId,
      customer.average_rating,
      customer.total_reviews,
      query,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Review Status for an Order
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Returns whether the customer and driver have submitted reviews for a given order.
   */
  async getReviewStatusAsync(orderId: number): Promise<ReviewStatusDto> {
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, customer_id: true, driver_id: true, status: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const reviews = await this._prisma.review.findMany({
      where: { order_id: orderId },
      select: { reviewer_type: true },
    });

    const customerReviewed = reviews.some(r => r.reviewer_type === ReviewUserType.Customer);
    const driverReviewed = reviews.some(r => r.reviewer_type === ReviewUserType.Driver);

    return { customerReviewed, driverReviewed };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generic method to fetch paginated reviews for a reviewee entity.
   * Avoids code duplication between driver and customer review endpoints.
   */
  private async getReviewsForEntityAsync(
    revieweeType: ReviewUserType,
    revieweeId: number,
    averageRating: number,
    totalReviews: number,
    query: ReviewQueryDto,
  ): Promise<ReviewListResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 10;
    const skip = (page - 1) * pageSize;

    const whereClause = {
      reviewee_type: revieweeType,
      reviewee_id: revieweeId,
    };

    // Fetch reviews and rating breakdown in parallel
    const [reviews, total, ratingCounts] = await Promise.all([
      this._prisma.review.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          reviewer_type: true,
          rating: true,
          title: true,
          comment: true,
          tags: true,
          is_anonymous: true,
          created_at: true,
        },
      }),
      this._prisma.review.count({ where: whereClause }),
      this._prisma.review.groupBy({
        by: ['rating'],
        where: whereClause,
        _count: { rating: true },
      }),
    ]);

    // Build rating breakdown
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const entry of ratingCounts) {
      ratingBreakdown[entry.rating as keyof typeof ratingBreakdown] = entry._count.rating;
    }

    // Map reviews to DTOs
    const reviewItems: ReviewItemDto[] = reviews.map(r => ({
      id: r.id,
      reviewerType: r.reviewer_type,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      tags: r.tags as string[] | null,
      is_anonymous: r.is_anonymous,
      created_at: r.created_at,
    }));

    return {
      averageRating,
      totalReviews,
      ratingBreakdown,
      reviews: reviewItems,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }
}
